# Comprueba que las tres bases cuentan la misma historia (brief del Entregable 4, seccion 8) y FALLA si algo no cuadra.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los datos que lee, que si las llevan,
#  se leen y se envian explicitamente como UTF-8.)
#
# Uso:   .\db\scripts\coherencia.ps1
# Requiere los tres contenedores levantados y la semilla cargada (db\scripts\cargar-semilla.ps1). SOLO LEE: no
# modifica ninguna base. Guarda la salida en db/evidencias/semilla/coherencia.txt.
# Codigo de salida: 0 si todo cuadra, 1 si alguna comprobacion falla o no se pudo ejecutar.
#
# Como funciona: exporta de PostgreSQL (db/relacional/pruebas/coherencia-exportar.sql) y de MongoDB
# (db/documental/pruebas/coherencia-exportar.js) dentro de sus contenedores, un proceso por base, y consulta a Neo4j por
# su API HTTP (CG-21, CG-22 y CG-23 entre otras), sin lanzar JVM. Luego compara los conjuntos aqui, en PowerShell.
#
# Comprobaciones:
#   C-01  los ids son UUID en minusculas en las tres bases (RNF-08)
#   C-02  cada ficha publicada existe en obra_resumen y como nodo, con el mismo tipo
#   C-03  sin huerfanos: cada ficha (tambien borrador), obra_resumen y nodo de obra existe en las tres bases
#   C-04  cada ficha publicada tiene las relaciones minimas de D-24 en el grafo (CG-22)
#   C-05  el reparto de cada ficha de pelicula coincide con las relaciones actuo_en, foto_url incluida (CG-21)
#   C-06  sigue coincide con seguimiento (CG-23)
#   C-07  leyo coincide con los estados "terminada" de LIBROS (CG-23, D-16)
#   C-08  los usuarios del grafo son los del relacional, sin huerfanos (CG-23)
#   C-09  promedio y total_resenas coinciden con las resenas no ocultas (RN-08)
#   C-10  cada comparativa une usuario, libro y pelicula existentes y unidos por adaptado_a (RN-06)
#   C-11  hay fichas en borrador y no tienen resenas, estados ni lugar en listas (no se muestran)
#   C-12  ISBN sin repetir entre libros y mezcla de libros con y sin ISBN (D-08)
#   C-13  existe al menos un administrador (el primero se crea en la semilla)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$utf8 = New-Object System.Text.UTF8Encoding($false)
$destino = Join-Path $raiz 'db\evidencias\semilla'
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$inicioTotal = Get-Date
$log = New-Object System.Collections.Generic.List[string]
function Decir([string]$texto, [string]$color) {
    if ($color) { Write-Host $texto -ForegroundColor $color } else { Write-Host $texto }
    $log.Add($texto)
}

# ------------------------------------------------------------------ lectura de las tres bases
function Exportar([string]$comando, [string]$nombre) {
    $tmp = Join-Path $env:TEMP "dlbp-coherencia-$nombre.txt"
    # cmd /c para que la redireccion guarde los bytes UTF-8 del contenedor sin convertirlos.
    cmd /c "$comando > `"$tmp`" 2>&1"
    $codigo = $LASTEXITCODE
    $texto = [IO.File]::ReadAllText($tmp, $utf8)
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if ($codigo -ne 0) { throw "No se pudo exportar de $nombre (codigo $codigo): $texto" }
    return $texto
}
function Secciones([string]$texto) {
    $r = @{}; $actual = $null
    foreach ($l in ($texto -split "`r?`n")) {
        if ($l -match '^#(\w+)$') { $actual = $Matches[1]; $r[$actual] = New-Object System.Collections.Generic.List[string] }
        elseif ($l.Trim() -ne '' -and $actual) { $r[$actual].Add($l.TrimEnd()) }
    }
    return $r
}
function Leer-Env([string]$clave) {
    $m = Select-String -Path (Join-Path $raiz '.env') -Pattern ('^' + $clave + '=(.*)$')
    if (-not $m) { throw "Falta $clave en .env" }
    return $m.Matches[0].Groups[1].Value.Trim()
}
$cabeceras = @{ Authorization = 'Basic ' + [Convert]::ToBase64String($utf8.GetBytes((Leer-Env 'NEO4J_USER') + ':' + (Leer-Env 'NEO4J_PASSWORD'))); Accept = 'application/json;charset=UTF-8' }
$uriNeo = 'http://127.0.0.1:' + (Leer-Env 'NEO4J_HTTP_HOST_PORT') + '/db/neo4j/tx/commit'
# Ejecuta una consulta de LECTURA y devuelve una lista de filas (cada fila, un arreglo de columnas)
function Cypher([string]$texto) {
    $cuerpo = '{"statements":[{"statement":' + (ConvertTo-Json -InputObject $texto -Compress) + ',"parameters":{}}]}'
    $r = Invoke-WebRequest -Uri $uriNeo -Method Post -Body $utf8.GetBytes($cuerpo) -ContentType 'application/json; charset=utf-8' -Headers $cabeceras -UseBasicParsing
    $resp = $utf8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json
    if ($resp.errors -and $resp.errors.Count -gt 0) { throw ('Neo4j: ' + $resp.errors[0].code + ' ' + $resp.errors[0].message) }
    $filas = New-Object System.Collections.ArrayList
    foreach ($d in @($resp.results[0].data)) { [void]$filas.Add(@($d.row)) }
    return , $filas
}
function Consulta-Archivo([string]$nombre) {
    $lineas = [IO.File]::ReadAllLines((Join-Path $raiz "db\grafo\consultas\$nombre.cypher"), $utf8) | Where-Object { $_ -notmatch '^\s*//' }
    return (($lineas -join "`n").Trim())
}

$PEL = 'Pel' + [char]0x00ED + 'cula'     # etiqueta Pelicula, con tilde
$t = Get-Date
Decir ("Coherencia entre bases - {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Decir ''
try {
    $pg = Secciones (Exportar 'docker exec dlbp-postgres sh /db/relacional/pruebas/psql.sh coherencia-exportar.sql' 'postgres')
    $tPg = [math]::Round(((Get-Date) - $t).TotalSeconds, 1); $t = Get-Date
    $mongo = (Exportar 'docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/coherencia-exportar.js' 'mongo').Trim() | ConvertFrom-Json
    $tMongo = [math]::Round(((Get-Date) - $t).TotalSeconds, 1); $t = Get-Date
    $nLibros = Cypher 'MATCH (l:Libro) RETURN l.obra_id ORDER BY 1'
    $nPelis = Cypher ('MATCH (f:`' + $PEL + '`) RETURN f.obra_id ORDER BY 1')
    $nUsuarios = Cypher 'MATCH (u:Usuario) RETURN u.usuario_id ORDER BY 1'
    $nPersonas = Cypher 'MATCH (p:Persona) RETURN p.persona_id ORDER BY 1'
    $nSinId = Cypher "MATCH (n) WITH n, coalesce(n.obra_id, n.persona_id, n.usuario_id) AS id WHERE id IS NULL OR NOT id =~ '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' RETURN head(labels(n)) + ':' + coalesce(toString(id), '(sin id)') LIMIT 10"
    $nNodos = Cypher 'MATCH (n) RETURN count(n)'
    $adaptadas = Cypher ('MATCH (l:Libro)-[:adaptado_a]->(f:`' + $PEL + '`) RETURN l.obra_id, f.obra_id ORDER BY 1, 2')
    $cg21 = Cypher (Consulta-Archivo 'CG-21')
    $cg22 = Cypher (Consulta-Archivo 'CG-22')
    $cg23 = Cypher (Consulta-Archivo 'CG-23')
    $tNeo = [math]::Round(((Get-Date) - $t).TotalSeconds, 1)
} catch {
    Decir "NO SE PUDO LEER UNA DE LAS BASES: $($_.Exception.Message)" 'Red'
    [IO.File]::WriteAllLines((Join-Path $destino 'coherencia.txt'), [string[]]$log, $utf8)
    exit 1
}
Decir ("Lectura: PostgreSQL {0} s, MongoDB {1} s, Neo4j {2} s" -f $tPg, $tMongo, $tNeo)
Decir ''

# ------------------------------------------------------------------ estructuras para comparar
function Conjunto($valores) { $h = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal); foreach ($v in $valores) { [void]$h.Add([string]$v) }; return , $h }
function Primeros($lista, [int]$n) { return @($lista | Select-Object -First $n) }
function Diferencia($a, $b, [string]$soloA, [string]$soloB) {
    $p = New-Object System.Collections.Generic.List[string]
    $sa = @($a | Where-Object { -not $b.Contains($_) } | Sort-Object)
    $sb = @($b | Where-Object { -not $a.Contains($_) } | Sort-Object)
    if ($sa.Count -gt 0) { $p.Add("$soloA ($($sa.Count)): " + ((Primeros $sa 4) -join ', ') + $(if ($sa.Count -gt 4) { ' ...' } else { '' })) }
    if ($sb.Count -gt 0) { $p.Add("$soloB ($($sb.Count)): " + ((Primeros $sb 4) -join ', ') + $(if ($sb.Count -gt 4) { ' ...' } else { '' })) }
    return , $p
}

$fichas = @($mongo.fichas)
$fichaPorId = @{}; foreach ($f in $fichas) { $fichaPorId[$f.id] = $f }
$publicadas = @($fichas | Where-Object { $_.estado -ceq 'publicada' })
$borradores = @($fichas | Where-Object { $_.estado -ceq 'borrador' })
$obraPg = @{}
foreach ($l in $pg['obras']) { $c = $l -split '\|'; $obraPg[$c[0]] = [pscustomobject]@{ tipo = $c[1]; promedio = $c[2]; total = [int]$c[3] } }
$recalculo = @{}
foreach ($l in $pg['recalculo']) { $c = $l -split '\|'; $recalculo[$c[0]] = [pscustomobject]@{ total = [int]$c[1]; promedio = $c[2] } }
$libroNodo = Conjunto ($nLibros | ForEach-Object { $_[0] })
$peliNodo = Conjunto ($nPelis | ForEach-Object { $_[0] })
$usuariosPg = Conjunto ($pg['usuarios'] | ForEach-Object { ($_ -split '\|')[0] })
$parAdaptado = Conjunto ($adaptadas | ForEach-Object { $_[0] + '|' + $_[1] })

# ------------------------------------------------------------------ comprobaciones
$resultados = New-Object System.Collections.Generic.List[object]
function Comprobar([string]$id, [string]$descripcion, $problemas, [string]$detalle) {
    $mal = @($problemas)
    $ok = ($mal.Count -eq 0)
    $resultados.Add([pscustomobject]@{ Id = $id; Ok = $ok })
    if ($ok) { Decir ("PASA   {0}  {1}" -f $id, $descripcion); if ($detalle) { Decir ("         -> $detalle") } }
    else {
        Decir ("FALLA  {0}  {1}" -f $id, $descripcion) 'Red'
        foreach ($p in (Primeros $mal 8)) { Decir ("         x $p") 'Red' }
        if ($mal.Count -gt 8) { Decir ("         x ... y $($mal.Count - 8) mas") 'Red' }
    }
}

# C-01 ids
$p = New-Object System.Collections.Generic.List[string]
$columnas = 0
foreach ($l in $pg['ids_mal_formados']) { $c = $l -split '\|'; $columnas++; if ([int]$c[1] -gt 0) { $p.Add("PostgreSQL $($c[0]): $($c[1]) id(s) mal formados") } }
if ($columnas -eq 0) { $p.Add('PostgreSQL: no se encontro ninguna columna UUID que revisar') }
foreach ($m in @($mongo.idsMalFormados)) { $p.Add("MongoDB: $m") }
foreach ($f in $nSinId) { $p.Add("Neo4j: nodo con id mal formado o sin id: $($f[0])") }
Comprobar 'C-01' 'ids UUID en minusculas en las tres bases' $p ("$columnas columnas UUID en PostgreSQL; $($fichas.Count) fichas y $(@($mongo.comparativas).Count) comparativas en MongoDB; $($nNodos[0][0]) nodos en Neo4j")

# C-02 fichas publicadas
$p = New-Object System.Collections.Generic.List[string]
foreach ($f in $publicadas) {
    $o = $obraPg[$f.id]
    if (-not $o) { $p.Add("la ficha publicada $($f.id) ($($f.titulo)) no esta en obra_resumen") }
    elseif ($o.tipo -cne $f.tipo) { $p.Add("la ficha $($f.id) es '$($f.tipo)' pero obra_resumen dice '$($o.tipo)'") }
    $enLibro = $libroNodo.Contains($f.id); $enPeli = $peliNodo.Contains($f.id)
    if (-not $enLibro -and -not $enPeli) { $p.Add("la ficha publicada $($f.id) ($($f.titulo)) no existe como nodo") }
    elseif ($f.tipo -ceq 'libro' -and -not $enLibro) { $p.Add("la ficha $($f.id) es un libro pero su nodo es una Pelicula") }
    elseif ($f.tipo -ceq 'pelicula' -and -not $enPeli) { $p.Add("la ficha $($f.id) es una pelicula pero su nodo es un Libro") }
}
Comprobar 'C-02' 'cada ficha publicada existe en obra_resumen y como nodo, con el mismo tipo' $p "$($publicadas.Count) fichas publicadas ($(@($publicadas | Where-Object { $_.tipo -ceq 'libro' }).Count) libros y $(@($publicadas | Where-Object { $_.tipo -ceq 'pelicula' }).Count) peliculas)"

# C-03 huerfanos
$p = New-Object System.Collections.Generic.List[string]
$idsFicha = Conjunto ($fichas | ForEach-Object { $_.id })
foreach ($id in $obraPg.Keys) { if (-not $idsFicha.Contains($id)) { $p.Add("obra_resumen $id no tiene ficha") } }
foreach ($id in $libroNodo) { if (-not $idsFicha.Contains($id)) { $p.Add("nodo Libro $id no tiene ficha") } }
foreach ($id in $peliNodo) { if (-not $idsFicha.Contains($id)) { $p.Add("nodo Pelicula $id no tiene ficha") } }
foreach ($f in $borradores) {
    if (-not $obraPg.ContainsKey($f.id)) { $p.Add("la ficha en borrador $($f.id) no esta en obra_resumen") }
    if (-not ($libroNodo.Contains($f.id) -or $peliNodo.Contains($f.id))) { $p.Add("la ficha en borrador $($f.id) no existe como nodo") }
}
Comprobar 'C-03' 'sin huerfanos: toda ficha, obra_resumen y nodo de obra existe en las tres bases' $p "$($fichas.Count) fichas, $($obraPg.Count) filas de obra_resumen, $($libroNodo.Count + $peliNodo.Count) nodos de obra"

# C-04 minimos de D-24 (CG-22: tipo, obra_id, n1, n2, n3)
$p = New-Object System.Collections.Generic.List[string]
$conteo = @{}; foreach ($f in $cg22) { $conteo[$f[1]] = $f }
foreach ($f in $publicadas) {
    $c = $conteo[$f.id]
    if (-not $c) { continue }                       # ya lo senala C-02
    $n1 = [int]$c[2]; $n2 = [int]$c[3]; $n3 = [int]$c[4]
    if ($f.tipo -ceq 'libro') {
        if ($n1 -lt 1) { $p.Add("D-24: el libro publicado '$($f.titulo)' no tiene autor") }
        if ($n2 -lt 1) { $p.Add("D-24: el libro publicado '$($f.titulo)' no tiene ninguna adaptacion") }
    } else {
        if ($n1 -ne 1) { $p.Add("D-24: la pelicula publicada '$($f.titulo)' tiene $n1 libros de origen (debe tener 1)") }
        if ($n2 -lt 1) { $p.Add("D-24: la pelicula publicada '$($f.titulo)' no tiene director") }
        if ($n3 -lt 1) { $p.Add("D-24: la pelicula publicada '$($f.titulo)' no tiene reparto") }
        if ($n3 -gt 300) { $p.Add("D-24: la pelicula publicada '$($f.titulo)' supera los 300 del reparto ($n3)") }
    }
}
$bajoMinimo = @($borradores | Where-Object { $c = $conteo[$_.id]; $c -and (($_.tipo -ceq 'libro' -and ([int]$c[2] -lt 1 -or [int]$c[3] -lt 1)) -or ($_.tipo -ceq 'pelicula' -and ([int]$c[2] -ne 1 -or [int]$c[3] -lt 1 -or [int]$c[4] -lt 1))) })
Comprobar 'C-04' 'cada ficha publicada tiene sus relaciones minimas de D-24 en el grafo' $p "$($publicadas.Count) fichas publicadas cumplen; $($bajoMinimo.Count) borrador(es) por debajo del minimo, como se espera ($(($bajoMinimo | ForEach-Object { $_.titulo }) -join ', '))"

# C-05 reparto de la ficha frente a actuo_en (CG-21: obra_id, reparto)
$p = New-Object System.Collections.Generic.List[string]
function Linea($persona, $nombre, $personaje, $orden, $foto) { return "$persona|$nombre|$personaje|$orden|$foto" }
$repartoGrafo = @{}
foreach ($f in $cg21) {
    $l = New-Object System.Collections.Generic.List[string]
    foreach ($r in @($f[1])) { $l.Add((Linea $r.persona_id $r.nombre $r.personaje $r.orden $r.foto_url)) }
    $repartoGrafo[$f[0]] = $l
}
$totalReparto = 0
foreach ($f in @($fichas | Where-Object { $_.tipo -ceq 'pelicula' })) {
    $enFicha = New-Object System.Collections.Generic.List[string]
    foreach ($r in @($f.reparto)) { $enFicha.Add((Linea $r.persona_id $r.nombre $r.personaje $r.orden $r.foto_url)) }
    $enGrafo = $repartoGrafo[$f.id]
    if ($null -eq $enGrafo) { $p.Add("'$($f.titulo)' ($($f.id)): la ficha tiene reparto pero la pelicula no existe en el grafo"); continue }
    $totalReparto += $enFicha.Count
    $d = Diferencia (Conjunto $enFicha) (Conjunto $enGrafo) "solo en la ficha" "solo en el grafo (actuo_en)"
    foreach ($x in $d) { $p.Add("'$($f.titulo)': $x") }
    if ($d.Count -eq 0 -and (($enFicha -join "`n") -cne ($enGrafo -join "`n"))) { $p.Add("'$($f.titulo)': mismo reparto pero en distinto orden") }
}
Comprobar 'C-05' 'el reparto de cada ficha de pelicula coincide con actuo_en (nombre, personaje, orden y foto_url)' $p "$totalReparto personas de reparto comparadas en $(@($fichas | Where-Object { $_.tipo -ceq 'pelicula' }).Count) peliculas"

# C-06 a C-08 con CG-23 (usuario_id, sigue[], leyo[])
$sigueGrafo = New-Object System.Collections.Generic.List[string]
$leyoGrafo = New-Object System.Collections.Generic.List[string]
foreach ($u in $cg23) {
    foreach ($s in @($u[1])) { $sigueGrafo.Add($u[0] + '|' + $s) }
    foreach ($o in @($u[2])) { $leyoGrafo.Add($u[0] + '|' + $o) }
}
$sigueRel = @($pg['seguimiento'])
$d = Diferencia (Conjunto $sigueRel) (Conjunto $sigueGrafo) 'solo en seguimiento (relacional)' 'solo en sigue (grafo)'
Comprobar 'C-06' 'sigue coincide con seguimiento' $d "$($sigueRel.Count) pares en cada base"
$leyoRel = @($pg['leyo'])
$d = Diferencia (Conjunto $leyoRel) (Conjunto $leyoGrafo) 'estado terminada de un libro sin leyo en el grafo' 'leyo sin estado terminada de un libro'
Comprobar 'C-07' 'leyo coincide con los estados terminada de LIBROS (las peliculas terminadas no cuentan)' $d "$($leyoRel.Count) pares en cada base"
$usuariosNeo = Conjunto ($cg23 | ForEach-Object { $_[0] })
$d = Diferencia $usuariosPg $usuariosNeo 'usuario del relacional sin nodo' 'nodo Usuario sin usuario en el relacional (huerfano)'
Comprobar 'C-08' 'los usuarios del grafo son los del relacional' $d "$($usuariosPg.Count) usuarios en cada base"

# C-09 promedio
$p = New-Object System.Collections.Generic.List[string]
foreach ($id in ($obraPg.Keys | Sort-Object)) {
    $o = $obraPg[$id]; $r = $recalculo[$id]
    if (-not $r) { $p.Add("$id : no hay recalculo (obra sin fila en obra_resumen)"); continue }
    if ($o.total -ne $r.total -or $o.promedio -cne $r.promedio) {
        $p.Add("$id : obra_resumen dice total=$($o.total) promedio=$(if ($o.promedio) { $o.promedio } else { '(nulo)' }); las resenas no ocultas dan total=$($r.total) promedio=$(if ($r.promedio) { $r.promedio } else { '(nulo)' })")
    }
}
$conResenas = @($obraPg.Values | Where-Object { $_.total -gt 0 }).Count
Comprobar 'C-09' 'promedio y total_resenas coinciden con las resenas no ocultas (RN-08)' $p "$($obraPg.Count) obras revisadas, $conResenas con resenas visibles"

# C-10 comparativas
$p = New-Object System.Collections.Generic.List[string]
foreach ($c in @($mongo.comparativas)) {
    $lf = $fichaPorId[$c.libro_id]; $pf = $fichaPorId[$c.pelicula_id]
    if (-not $lf -or $lf.tipo -cne 'libro') { $p.Add("comparativa $($c.id): libro_id $($c.libro_id) no es la ficha de un libro") }
    if (-not $pf -or $pf.tipo -cne 'pelicula') { $p.Add("comparativa $($c.id): pelicula_id $($c.pelicula_id) no es la ficha de una pelicula") }
    if (-not $usuariosPg.Contains($c.usuario_id)) { $p.Add("comparativa $($c.id): el usuario $($c.usuario_id) no existe en el relacional") }
    if (-not $parAdaptado.Contains($c.libro_id + '|' + $c.pelicula_id)) { $p.Add("comparativa $($c.id): el libro y la pelicula no estan unidos por adaptado_a (RN-06)") }
}
Comprobar 'C-10' 'cada comparativa une usuario, libro y pelicula existentes y unidos por adaptado_a' $p "$(@($mongo.comparativas).Count) comparativas sobre $(@(@($mongo.comparativas) | ForEach-Object { $_.libro_id + '|' + $_.pelicula_id } | Sort-Object -Unique).Count) parejas distintas"

# C-11 borradores
$p = New-Object System.Collections.Generic.List[string]
if ($borradores.Count -lt 1) { $p.Add('la semilla debe incluir al menos una ficha en borrador') }
$conActividad = Conjunto $pg['obras_con_actividad']
foreach ($f in $borradores) { if ($conActividad.Contains($f.id)) { $p.Add("la ficha en borrador '$($f.titulo)' tiene resenas, estados o esta en una lista: se mostraria") } }
Comprobar 'C-11' 'hay fichas en borrador y no tienen resenas, estados ni lugar en listas' $p "$($borradores.Count) borradores: $(($borradores | ForEach-Object { $_.tipo + ' ' + $_.titulo }) -join ', ')"

# C-12 ISBN
$p = New-Object System.Collections.Generic.List[string]
$vistos = @{}; $conIsbn = 0; $sinIsbn = 0
foreach ($f in @($fichas | Where-Object { $_.tipo -ceq 'libro' })) {
    $is = @($f.isbns)
    if ($is.Count -gt 0) { $conIsbn++ } else { $sinIsbn++ }
    foreach ($i in $is) { if ($vistos.ContainsKey($i)) { $p.Add("ISBN $i repetido en '$($f.titulo)' y en '$($vistos[$i])'") } else { $vistos[$i] = $f.titulo } }
}
if ($conIsbn -lt 1) { $p.Add('ningun libro tiene ISBN') }
if ($sinIsbn -lt 1) { $p.Add('ningun libro esta sin ISBN: no se prueba el indice sparse') }
Comprobar 'C-12' 'ISBN sin repetir entre libros y mezcla de libros con y sin ISBN' $p "$conIsbn libros con ISBN ($($vistos.Count) ISBN distintos) y $sinIsbn sin ISBN"

# C-13 administrador
$admins = @($pg['usuarios'] | Where-Object { ($_ -split '\|')[1] -ceq 'admin' }).Count
$p = @(); if ($admins -lt 1) { $p = @('no hay ningun usuario con rol admin') }
Comprobar 'C-13' 'existe al menos un administrador' $p "$admins administrador(es)"

# ------------------------------------------------------------------ resumen
$fallan = @($resultados | Where-Object { -not $_.Ok }).Count
$seg = [math]::Round(((Get-Date) - $inicioTotal).TotalSeconds, 1)
Decir ''
if ($fallan -eq 0) { Decir ("Todo cuadra: {0} de {0} comprobaciones pasan.  ({1} s)" -f $resultados.Count, $seg) 'Green' }
else { Decir ("{0} de {1} comprobaciones FALLAN.  ({2} s)" -f $fallan, $resultados.Count, $seg) 'Red' }
[IO.File]::WriteAllLines((Join-Path $destino 'coherencia.txt'), [string[]]$log, $utf8)
if ($fallan -gt 0) { exit 1 }
exit 0
