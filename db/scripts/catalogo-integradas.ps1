# Ejecuta las operaciones INTEGRADAS del catalogo (Entregable 5) y guarda la salida en db/evidencias/catalogo/integradas.txt.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los textos con acentos que salen de las bases se
#  leen y se guardan como UTF-8; los esperados de este archivo evitan los acentos.)
#
# Uso:   .\db\scripts\catalogo-integradas.ps1                 las cinco
#        .\db\scripts\catalogo-integradas.ps1 -Solo INT-02    solo una (o varias: -Solo INT-02,INT-04)
#
# Todavia NO hay API ni worker (entregables 6 y 7). Este script HACE DE API: llama a las tres bases en el orden que dicen
# docs/arquitectura/04-fuente-de-verdad-y-sincronizacion.md y docs/modelado/matriz-responsabilidades.md, seccion 4.
# Cada paso del registro lleva una etiqueta: [REAL] lo ejecuto una base de verdad; [SIMULADO] lo haria el worker o la
# reconciliacion, que no existen, y aqui lo ejecuta el script a mano.
#
# Datos de prueba: ids 99000000-0000-4000-8000-0000000000NN. Cada integrada los crea y los BORRA al terminar (aunque falle);
# al final se comprueba con coherencia.ps1 que la semilla quedo intacta. Un solo proceso pesado a la vez (memoria, D-36).
# Temporales en db/tmp (ignorado por git; el contenedor ve ./db en /db).
# Codigo de salida: 0 si todo pasa, 1 si algo falla.

param([string[]]$Solo)

$ErrorActionPreference = 'Stop'
if ($Solo) { $Solo = @($Solo | ForEach-Object { $_ -split ',' }) }
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dirGrafo = Join-Path $raiz 'db\grafo'
$tmp = Join-Path $raiz 'db\tmp'
$destino = Join-Path $raiz 'db\evidencias\catalogo'
New-Item -ItemType Directory -Force -Path $tmp, $destino | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ---------------------------------------------------------------- conexiones
function Leer-Env([string]$clave, [string]$porDefecto) {
    $m = Select-String -Path (Join-Path $raiz '.env') -Pattern ('^' + $clave + '=(.*)$')
    if ($m) { return $m.Matches[0].Groups[1].Value.Trim() }
    return $porDefecto
}
$neoUsuario = Leer-Env 'NEO4J_USER' 'neo4j'
$neoClave = Leer-Env 'NEO4J_PASSWORD' ''
$neoPuerto = Leer-Env 'NEO4J_HTTP_HOST_PORT' '7474'
$neoBase = "http://127.0.0.1:$neoPuerto/db/neo4j/tx"
$neoCab = @{ Authorization = 'Basic ' + [Convert]::ToBase64String($utf8.GetBytes("${neoUsuario}:${neoClave}")); Accept = 'application/json;charset=UTF-8' }

# Letras con acento que este archivo no puede escribir directamente
$L_PELICULA = 'Pel' + [char]0x00ED + 'cula'
$L_LEYO = 'ley' + [char]0x00F3
$L_ACTUO = 'actu' + [char]0x00F3 + '_en'

function Docker-Salida([string]$comando) {
    $archivo = Join-Path $tmp 'salida.txt'
    cmd /c "$comando > `"$archivo`" 2>&1"
    $codigo = $LASTEXITCODE
    $texto = [IO.File]::ReadAllText($archivo, $utf8).Trim()
    return @{ Texto = $texto; Codigo = $codigo }
}
# PostgreSQL: el SQL va a db/tmp/pg.sql y se ejecuta dentro del contenedor (sin BOM, sin comillas anidadas)
function Pg([string]$sql) {
    $cab = "\pset tuples_only on`n\pset format unaligned`n\set VERBOSITY verbose`n"
    [IO.File]::WriteAllText((Join-Path $tmp 'pg.sql'), $cab + $sql + "`n", $utf8)
    return Docker-Salida 'docker exec dlbp-postgres sh /db/relacional/pruebas/psql.sh ../../tmp/pg.sql'
}
# MongoDB: un solo proceso mongosh por llamada; la base por defecto es la de la aplicacion (dlbp)
function Mongo([string]$js) {
    [IO.File]::WriteAllText((Join-Path $tmp 'm.js'), $js + "`n", $utf8)
    return Docker-Salida 'docker exec dlbp-mongo sh /db/documental/mongo.sh ../tmp/m.js'
}
# Neo4j por su API HTTP (sin JVM). Cada llamada es una transaccion que se confirma.
function Neo([string[]]$sentencias, [string]$parametrosJson, [string]$uriBase) {
    if (-not $uriBase) { $uriBase = $neoBase }
    $items = foreach ($s in $sentencias) { '{"statement":' + (ConvertTo-Json -InputObject $s -Compress) + ',"parameters":{' + $parametrosJson + '}}' }
    $cuerpo = '{"statements":[' + ($items -join ',') + ']}'
    try {
        $r = Invoke-WebRequest -Uri ($uriBase + '/commit') -Method Post -Body $utf8.GetBytes($cuerpo) -ContentType 'application/json; charset=utf-8' -Headers $neoCab -UseBasicParsing -TimeoutSec 30
        return ($utf8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json)
    } catch { throw "Neo4j no responde en $uriBase : $($_.Exception.Message)" }
}
function Filas($resp, [int]$cual = 0) {
    if ($resp.errors -and $resp.errors.Count -gt 0) { throw ('Neo4j: ' + $resp.errors[0].code + ' ' + $resp.errors[0].message) }
    $res = $resp.results[$cual]
    $lista = New-Object System.Collections.Generic.List[object]
    foreach ($d in $res.data) { [void]$lista.Add(@($d.row)) }
    return , $lista
}
function CG([string]$archivo) {
    $c = [IO.File]::ReadAllLines((Join-Path $dirGrafo ('consultas\' + $archivo)), $utf8) | Where-Object { $_ -notmatch '^\s*//' }
    $t = ($c -join "`n").Trim()
    return ($t -replace ';\s*$', '')
}
# D-23 / D-42: en UNA transaccion, bloquear el nodo de la pelicula, comprobar con CG-04 y solo si no hay libro de origen crear con CG-15.
function Neo-Adaptacion([string]$libro, [string]$pelicula) {
    $abrir = '{"statements":[{"statement":' + (ConvertTo-Json -InputObject (CG 'CG-15-bloqueo.cypher') -Compress) + ',"parameters":{"pelicula_id":"' + $pelicula + '"}},{"statement":' + (ConvertTo-Json -InputObject (CG 'CG-04.cypher') -Compress) + ',"parameters":{"pelicula_id":"' + $pelicula + '"}}]}'
    $r = Invoke-WebRequest -Uri $neoBase -Method Post -Body $utf8.GetBytes($abrir) -ContentType 'application/json; charset=utf-8' -Headers $neoCab -UseBasicParsing
    $resp = ($utf8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json)
    $txUri = ($resp.commit -replace '/commit$', '')
    $bloqueo = @($resp.results[0].data).Count
    $conLibro = @($resp.results[1].data).Count
    if ($bloqueo -eq 0) { Invoke-WebRequest -Uri $txUri -Method Delete -Headers $neoCab -UseBasicParsing | Out-Null; return 'rechazada: la pelicula no existe en el grafo' }
    if ($conLibro -gt 0) { Invoke-WebRequest -Uri $txUri -Method Delete -Headers $neoCab -UseBasicParsing | Out-Null; return 'rechazada: la pelicula ya tiene libro de origen (RN-07); no se llamo a CG-15' }
    $crear = '{"statements":[{"statement":' + (ConvertTo-Json -InputObject (CG 'CG-15.cypher') -Compress) + ',"parameters":{"libro_id":"' + $libro + '","pelicula_id":"' + $pelicula + '"}}]}'
    $r2 = Invoke-WebRequest -Uri ($txUri + '/commit') -Method Post -Body $utf8.GetBytes($crear) -ContentType 'application/json; charset=utf-8' -Headers $neoCab -UseBasicParsing
    $resp2 = ($utf8.GetString($r2.RawContentStream.ToArray()) | ConvertFrom-Json)
    if ($resp2.errors -and $resp2.errors.Count -gt 0) { throw ('Neo4j: ' + $resp2.errors[0].message) }
    if (@($resp2.results[0].data).Count -eq 0) { return 'rechazada: el libro no existe en el grafo' }
    return 'creada'
}
function Codigo-Pg([string]$texto) {
    if ($texto -match 'ERROR:\s+(\w{5}):[^\r\n]*constraint "([^"]+)"') { return $Matches[1] + ' ' + $Matches[2] }
    if ($texto -match 'ERROR:\s+(\w{5}):') { return $Matches[1] }
    return 'sin error'
}
function S([string]$prefijo, [int]$n) { return $prefijo + '000000-0000-4000-8000-' + $n.ToString('000000000000') }
function T([int]$n) { return S '99' $n }

# ---------------------------------------------------------------- registro de casos
$salida = New-Object System.Collections.Generic.List[string]
$salida.Add("Operaciones integradas del catalogo  ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))")
$salida.Add('Este script HACE DE API: llama a PostgreSQL, MongoDB y Neo4j en el orden de los documentos. [REAL] = lo ejecuto una base; [SIMULADO] = lo haria el worker o la reconciliacion (no existen) y aqui lo ejecuta el script.')
$salida.Add('')
$script:log = New-Object System.Collections.Generic.List[string]
$resultados = New-Object System.Collections.Specialized.OrderedDictionary
function Paso([string]$etiqueta, [string]$base, [string]$que, [string]$real) {
    $script:log.Add(("   [{0}] {1} - {2}: {3}" -f $etiqueta, $base, $que, $real))
}
function Caso([string]$id, [string]$descripcion, [string]$esperado, [scriptblock]$cuerpo) {
    if ($Solo -and -not ($Solo | Where-Object { $id -like "$_*" })) { return }
    $script:log = New-Object System.Collections.Generic.List[string]
    $t0 = Get-Date
    try { $obtenido = [string](& $cuerpo) } catch { $obtenido = 'EXCEPCION: ' + $_.Exception.Message }
    $seg = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
    $ok = ($obtenido -ceq $esperado)
    $resultados[$id] = $ok
    $marca = if ($ok) { 'PASA ' } else { 'FALLA' }
    $salida.Add(('{0}  {1,-12} {2}  ({3} s)' -f $marca, $id, $descripcion, $seg))
    foreach ($l in $script:log) { $salida.Add($l) }
    $salida.Add("               esperado: $esperado")
    $salida.Add("               obtenido: $obtenido")
    Write-Host ('{0}  {1,-12} {2}  ({3} s)' -f $marca, $id, $descripcion, $seg)
}
function Seccion([string]$titulo) {
    $salida.Add('')
    $salida.Add('=' * 110)
    $salida.Add($titulo)
    $salida.Add('=' * 110)
    Write-Host "`n$titulo"
}
function Incluida([string]$id) { if (-not $Solo) { return $true }; return [bool]($Solo | Where-Object { $id -like "$_*" }) }

$DUNE = S 'b1' 1; $DUNE21 = S 'f1' 1; $DUNE2 = S 'f1' 2
$ANA = S 'c1' 2; $LUIS = S 'c1' 3; $MARTA = S 'c1' 4; $PEDRO = S 'c1' 5; $SOFIA = S 'c1' 6; $DIEGO = S 'c1' 7

# Limpieza general de TODO lo que cree el script en las tres bases (ids 99000000-...)
function Limpiar-Todo {
    Pg "DELETE FROM sync_outbox WHERE payload::text LIKE '%99000000-0000-4000-8000-%'; DELETE FROM usuario WHERE usuario_id::text LIKE '99000000-%'; DELETE FROM obra_resumen WHERE obra_id::text LIKE '99000000-%';" | Out-Null
    Mongo "['libros','peliculas'].forEach(c => db.getCollection(c).deleteMany({_id: /^99000000-/})); db.resenas_comparativas.deleteMany({`$or: [{_id: /^99000000-/}, {usuario_id: /^99000000-/}]});" | Out-Null
    Neo @('MATCH (n) WHERE n.persona_id STARTS WITH ''99000000-'' OR n.obra_id STARTS WITH ''99000000-'' OR n.usuario_id STARTS WITH ''99000000-'' DETACH DELETE n') '' | Out-Null
}

# Por si una ejecucion anterior se interrumpio a medias: empezar sin ningun dato de prueba
Limpiar-Todo

# ============================================================================================================== INT-02
# Publicar una resena y ver la ficha con su promedio (RF-13, RF-06). Bases: PostgreSQL (O7, O17) y MongoDB (AP-01, AP-02).
if (Incluida 'INT-02') {
    Seccion 'INT-02  Publicar una resena y ver la ficha con su promedio (RF-13 -> RF-06): PostgreSQL + MongoDB (+ el grafo, que aun NO la ve)'
    $U1 = T 1; $U2 = T 2
    function O7([string]$u, [string]$obra, [int]$cal) {
        return "BEGIN; INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, texto) VALUES (gen_random_uuid(), '$u', '$obra', $cal, 'resena de la integrada');" +
               " SELECT 'previo=' || coalesce((SELECT estado::text FROM estado_obra WHERE usuario_id = '$u' AND obra_id = '$obra' FOR UPDATE), 'sin estado');" +
               " INSERT INTO sync_outbox (tipo_evento, payload) SELECT 'obra_leida', jsonb_build_object('usuario_id', '$u', 'obra_id', '$obra') WHERE NOT EXISTS (SELECT 1 FROM estado_obra WHERE usuario_id = '$u' AND obra_id = '$obra' AND estado = 'terminada');" +
               " INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES ('$u', '$obra', 'terminada') ON CONFLICT (usuario_id, obra_id) DO UPDATE SET estado = 'terminada', actualizado_en = now(); COMMIT;"
    }
    function Promedio([string]$obra) { return (Pg "SELECT coalesce(promedio::text, 'nulo') || '|' || total_resenas FROM obra_resumen WHERE obra_id = '$obra';").Texto }
    function Ficha([string]$coleccion, [string]$id) {
        return (Mongo "const d = db.getCollection('$coleccion').findOne({_id: '$id'}); print(d.titulo + '|' + d.actualizado_en.toISOString());").Texto
    }
    function Leyo-En-Grafo([string]$u) {
        return [string](Filas (Neo @("MATCH (:Usuario {usuario_id: '$u'})-[r:``$L_LEYO``]->() RETURN count(r)") ''))[0][0]
    }
    Pg "INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES ('$U1', 'int02-1@ejemplo.test', repeat('x', 60), 'Integrada uno'), ('$U2', 'int02-2@ejemplo.test', repeat('x', 60), 'Integrada dos');" | Out-Null
    $fichaInicial = Ficha 'libros' $DUNE
    $peliInicial = Ficha 'peliculas' $DUNE21
    try {
        Caso 'INT-02-n1' 'Publicar una resena: promedio y total cambian, la ficha de MongoDB no, el evento queda pendiente y el grafo todavia no tiene leyo' `
             'antes 4.33|3; despues 4.00|4; ficha sin cambios; eventos pendientes 1; leyo en el grafo 0' {
            $antes = Promedio $DUNE
            Paso 'REAL' 'PostgreSQL' 'O17 promedio|total de Dune antes' $antes
            Paso 'REAL' 'MongoDB' 'AP-01 ficha de Dune (titulo|actualizado_en)' $fichaInicial
            $r = Pg (O7 $U1 $DUNE 3)
            Paso 'REAL' 'PostgreSQL' 'O7 en una transaccion (resena + trigger + estado + evento)' ($r.Texto -replace "`n", ' ')
            $despues = Promedio $DUNE
            Paso 'REAL' 'PostgreSQL' 'O17 promedio|total despues' $despues
            $fichaDespues = Ficha 'libros' $DUNE
            Paso 'REAL' 'MongoDB' 'AP-01 ficha de Dune despues' $fichaDespues
            $ev = (Pg "SELECT count(*) FROM sync_outbox WHERE estado = 'pendiente' AND tipo_evento = 'obra_leida' AND payload->>'usuario_id' = '$U1';").Texto
            Paso 'REAL' 'PostgreSQL' 'eventos obra_leida pendientes del usuario' $ev
            $g = Leyo-En-Grafo $U1
            Paso 'REAL' 'Neo4j' 'relaciones leyo del usuario (el worker no corre: aun no se aplica el evento)' $g
            $igual = if ($fichaDespues -ceq $fichaInicial) { 'sin cambios' } else { 'CAMBIO' }
            "antes $antes; despues $despues; ficha $igual; eventos pendientes $ev; leyo en el grafo $g"
        }
        Caso 'INT-02-l1' 'Una segunda resena de otro usuario con calificacion 1 (limite inferior): el promedio baja a 3.40 con 5 resenas' `
             'previo=sin estado; Dune 3.40|5; evento nuevo' {
            $r = Pg (O7 $U2 $DUNE 1)
            Paso 'REAL' 'PostgreSQL' 'O7 con calificacion 1' ($r.Texto -replace "`n", ' ')
            $p = Promedio $DUNE
            Paso 'REAL' 'PostgreSQL' 'O17 promedio|total' $p
            $ev = (Pg "SELECT count(*) FROM sync_outbox WHERE estado = 'pendiente' AND tipo_evento = 'obra_leida' AND payload->>'usuario_id' = '$U2';").Texto
            $previo = if ($r.Texto -match 'previo=([a-z ]+)') { 'previo=' + $Matches[1].Trim() } else { 'sin previo' }
            "$previo; Dune $p; " + $(if ($ev -eq '1') { 'evento nuevo' } else { "eventos=$ev" })
        }
        Caso 'INT-02-l2' 'La resena de una PELICULA tambien actualiza su ficha y deja evento (el worker lo descartaria, D-16): Dune 2021 pasa a 4.00 con 3' `
             'antes 3.50|2; despues 4.00|3; evento obra_leida pendiente' {
            $antes = Promedio $DUNE21
            Paso 'REAL' 'PostgreSQL' 'O17 promedio|total de la pelicula antes' $antes
            $r = Pg (O7 $U1 $DUNE21 5)
            Paso 'REAL' 'PostgreSQL' 'O7' ($r.Texto -replace "`n", ' ')
            $despues = Promedio $DUNE21
            Paso 'REAL' 'PostgreSQL' 'O17 promedio|total despues' $despues
            Paso 'REAL' 'MongoDB' 'AP-02 ficha de la pelicula' (Ficha 'peliculas' $DUNE21)
            $ev = (Pg "SELECT count(*) FROM sync_outbox WHERE estado = 'pendiente' AND tipo_evento = 'obra_leida' AND payload->>'usuario_id' = '$U1' AND payload->>'obra_id' = '$DUNE21';").Texto
            "antes $antes; despues $despues; " + $(if ($ev -eq '1') { 'evento obra_leida pendiente' } else { "eventos=$ev" })
        }
        Caso 'INT-02-e1' 'Calificacion 6: PostgreSQL rechaza (RN-02) y no cambian ni el promedio, ni el estado, ni los eventos' `
             '23514 ck_resena_calificacion; Dune 3.40|5; estado=pendiente; eventos pendientes 2' {
            $u3 = T 3
            Pg "INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES ('$u3', 'int02-3@ejemplo.test', repeat('x', 60), 'Integrada tres');" | Out-Null
            $r = Pg (O7 $u3 $DUNE 6)
            $cod = Codigo-Pg $r.Texto
            Paso 'REAL' 'PostgreSQL' 'O7 con calificacion 6' ($r.Texto -replace "`n", ' ' ).Substring(0, [math]::Min(170, $r.Texto.Length))
            $p = Promedio $DUNE
            $estado = (Pg "SELECT coalesce((SELECT estado::text FROM estado_obra WHERE usuario_id = '$u3' AND obra_id = '$DUNE'), 'pendiente');").Texto
            $ev = (Pg "SELECT count(*) FROM sync_outbox WHERE estado = 'pendiente' AND payload::text LIKE '%99000000-0000-4000-8000-%' AND tipo_evento = 'obra_leida' AND payload->>'obra_id' = '$DUNE';").Texto
            Paso 'REAL' 'PostgreSQL' 'estado de la obra para el usuario y eventos pendientes de Dune' "estado=$estado; eventos=$ev"
            "$cod; Dune $p; estado=$estado; eventos pendientes $ev"
        }
        Caso 'INT-02-e2' 'Una segunda resena del mismo usuario sobre la misma obra: RN-01; el promedio no cambia' `
             '23505 uq_resena_usuario_obra; Dune 3.40|5' {
            $r = Pg (O7 $U1 $DUNE 2)
            Paso 'REAL' 'PostgreSQL' 'O7 repetida' ($r.Texto -replace "`n", ' ').Substring(0, [math]::Min(170, $r.Texto.Length))
            $cod = Codigo-Pg $r.Texto
            "$cod; Dune $(Promedio $DUNE)"
        }
        Caso 'INT-02-l3' 'Al eliminar los usuarios de prueba (O4), el trigger devuelve los promedios a los de la semilla: Dune 4.33|3 y Dune 2021 3.50|2' `
             'Dune 4.33|3; Dune 2021 3.50|2; ficha de Dune igual a la inicial' {
            Pg "DELETE FROM usuario WHERE usuario_id::text LIKE '99000000-%'; DELETE FROM sync_outbox WHERE payload::text LIKE '%99000000-0000-4000-8000-%';" | Out-Null
            $a = Promedio $DUNE; $b = Promedio $DUNE21
            Paso 'REAL' 'PostgreSQL' 'promedios tras la cascada' "Dune $a; Dune 2021 $b"
            $f = Ficha 'libros' $DUNE
            $igual = if ($f -ceq $fichaInicial) { 'igual a la inicial' } else { 'DISTINTA' }
            "Dune $a; Dune 2021 $b; ficha de Dune $igual"
        }
    } finally {
        Pg "DELETE FROM sync_outbox WHERE payload::text LIKE '%99000000-0000-4000-8000-%'; DELETE FROM usuario WHERE usuario_id::text LIKE '99000000-%';" | Out-Null
    }
}

# ============================================================================================================== INT-04
# Recomendar libros (RF-26): O18 (PostgreSQL) -> CG-08 (Neo4j) -> AP-04 (MongoDB). Todo es de lectura sobre la semilla.
if (Incluida 'INT-04') {
    Seccion 'INT-04  Recomendar libros por adaptaciones del mismo director (RF-26): PostgreSQL (O18) -> Neo4j (CG-08) -> MongoDB (AP-04)'
    function Recomendar([string]$usuario, [int]$limite) {
        $sql = "SELECT e.obra_id FROM estado_obra e JOIN resena r ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id JOIN obra_resumen o ON o.obra_id = e.obra_id " +
               "WHERE e.usuario_id = '$usuario' AND e.estado = 'terminada' AND o.tipo = 'libro' AND r.calificacion >= 4 AND r.oculta = false ORDER BY r.calificacion DESC, r.actualizado_en DESC LIMIT $limite;"
        $o18 = Pg $sql
        $partida = @($o18.Texto -split "`n" | Where-Object { $_ -match '^[0-9a-f]{8}-' } | ForEach-Object { $_.Trim() })
        Paso 'REAL' 'PostgreSQL' "O18 libros de partida (limite $limite)" $(if ($partida.Count) { ($partida | ForEach-Object { 'b' + $_.Substring($_.Length - 2) }) -join ', ' } else { '(ninguno)' })
        if ($partida.Count -eq 0) { Paso 'REAL' 'Neo4j' 'CG-08' 'no se llama: no hay libros de partida'; return @{ Recs = @(); Titulos = @() } }
        $lista = '[' + (($partida | ForEach-Object { '"' + $_ + '"' }) -join ',') + ']'
        $resp = Neo @((CG 'CG-08.cypher')) ('"libros_partida":' + $lista + ',"usuario_id":"' + $usuario + '"')
        $filas = Filas $resp
        $recs = @($filas | ForEach-Object { $_[0] } | Select-Object -Unique)
        Paso 'REAL' 'Neo4j' 'CG-08 (libro recomendado <- libro de partida por director)' $(if ($filas.Count) { (($filas | ForEach-Object { 'b' + $_[0].Substring($_[0].Length - 2) + ' <- b' + $_[1].Substring($_[1].Length - 2) + ' por ' + $_[3] }) -join '; ') } else { '(sin filas)' })
        if ($recs.Count -eq 0) { Paso 'REAL' 'MongoDB' 'AP-04' 'no se llama: no hay ids que presentar'; return @{ Recs = @(); Titulos = @() } }
        $ids = '[' + (($recs | ForEach-Object { "'" + $_ + "'" }) -join ',') + ']'
        $m = Mongo "const ids = $ids; const t = db.libros.find({_id: {`$in: ids}, estado_publicacion: 'publicada'}).toArray().map(d => d.titulo).sort(); print(JSON.stringify(t));"
        $tj = $m.Texto | ConvertFrom-Json; $titulos = @($tj | ForEach-Object { $_ })
        Paso 'REAL' 'MongoDB' 'AP-04 titulos de los libros recomendados' ($titulos -join ' | ')
        return @{ Recs = $recs; Titulos = $titulos }
    }
    function Cortos($ids) { return (($ids | ForEach-Object { 'b' + $_.Substring($_.Length - 2) } | Sort-Object) -join ',') }
    Caso 'INT-04-n1' 'RF-26 para Ana (partida: Dune y El marciano): 2 libros recomendados, ambos con ficha' 'recomendados b02,b04; 2 fichas' {
        $r = Recomendar $ANA 20
        "recomendados $(Cortos $r.Recs); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-n2' 'RF-26 para Marta (empate en 4: Orgullo y prejuicio y Dune): recomienda Expiacion y Historia de tu vida' 'recomendados b04,b09; 2 fichas' {
        $r = Recomendar $MARTA 20
        "recomendados $(Cortos $r.Recs); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-l1' 'Con :limite 1 solo parte del mejor calificado (Ana: Dune) y recomienda un solo libro' 'recomendados b04; 1 fichas' {
        $r = Recomendar $ANA 1
        "recomendados $(Cortos $r.Recs); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-l2' 'Pedro ya leyo el otro libro del director: el grafo no devuelve nada y no se consultan fichas' 'recomendados (ninguno); 0 fichas' {
        $r = Recomendar $PEDRO 20
        "recomendados $(if ($r.Recs.Count) { Cortos $r.Recs } else { '(ninguno)' }); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-e1' 'Sofia no termino ningun libro: O18 devuelve vacio, no se llama al grafo' 'recomendados (ninguno); 0 fichas' {
        $r = Recomendar $SOFIA 20
        "recomendados $(if ($r.Recs.Count) { Cortos $r.Recs } else { '(ninguno)' }); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-e2' 'Elena califico 2 su libro terminado: no es de partida (RN-11), no hay recomendaciones' 'recomendados (ninguno); 0 fichas' {
        $r = Recomendar (S 'c1' 8) 20
        "recomendados $(if ($r.Recs.Count) { Cortos $r.Recs } else { '(ninguno)' }); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-e3' 'Un usuario que no existe: O18 vacio y nada que recomendar (no falla)' 'recomendados (ninguno); 0 fichas' {
        $r = Recomendar (T 9) 20
        "recomendados $(if ($r.Recs.Count) { Cortos $r.Recs } else { '(ninguno)' }); $($r.Titulos.Count) fichas"
    }
    Caso 'INT-04-e4' 'Ana: la resena oculta de Expiacion y el estado pendiente de Orgullo y prejuicio no la llevan a recomendar nada a partir de ellos (no aparecen como partida)' 'partida sin b08 ni b09' {
        $o18 = Pg "SELECT e.obra_id FROM estado_obra e JOIN resena r ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id JOIN obra_resumen o ON o.obra_id = e.obra_id WHERE e.usuario_id = '$ANA' AND e.estado = 'terminada' AND o.tipo = 'libro' AND r.calificacion >= 4 AND r.oculta = false;"
        Paso 'REAL' 'PostgreSQL' 'O18 de Ana' ($o18.Texto -replace "`n", ', ')
        $b08 = S 'b1' 8; $b09 = S 'b1' 9
        if (($o18.Texto -match $b08) -or ($o18.Texto -match $b09)) { 'partida CON b08 o b09' } else { 'partida sin b08 ni b09' }
    }
}

# ============================================================================================================== INT-06
# Resena comparativa con validacion de la adaptacion (RF-16, RN-05, RN-06): PostgreSQL (usuario) + MongoDB (AP-05, AP-18) + Neo4j (CG-10).
if (Incluida 'INT-06') {
    Seccion 'INT-06  Resena comparativa con validacion de la adaptacion (RF-16, RN-05, RN-06): PostgreSQL + MongoDB (AP-05, AP-18) + Neo4j (CG-10)'
    $creadas = New-Object System.Collections.Generic.List[string]
    function Comparar([string]$usuario, [string]$libro, [string]$pelicula, [string]$neoSimuladoCaido) {
        # 1. el usuario existe (PostgreSQL)
        $u = (Pg "SELECT count(*) FROM usuario WHERE usuario_id = '$usuario';").Texto
        Paso 'REAL' 'PostgreSQL' 'el usuario existe' $u
        if ($u -ne '1') { return 'rechazada: el usuario no existe' }
        # 2. AP-05 de las dos obras (MongoDB, solo lectura)
        $m = Mongo "const l = db.libros.findOne({_id: '$libro'}, {estado_publicacion: 1}); const p = db.peliculas.findOne({_id: '$pelicula'}, {estado_publicacion: 1}); print((l ? l.estado_publicacion : 'no existe') + '|' + (p ? p.estado_publicacion : 'no existe'));"
        Paso 'REAL' 'MongoDB' 'AP-05 libro|pelicula (existencia y estado de publicacion)' $m.Texto
        $e = $m.Texto -split '\|'
        if ($e[0] -eq 'no existe' -or $e[1] -eq 'no existe') { return 'rechazada: una de las obras no existe' }
        if ($e[0] -ne 'publicada' -or $e[1] -ne 'publicada') { return 'rechazada: una de las fichas esta en borrador' }
        # 3. CG-10 (Neo4j). Si el grafo no responde: error recuperable, no se guarda nada.
        try {
            $uri = if ($neoSimuladoCaido) { 'http://127.0.0.1:1/db/neo4j/tx' } else { $neoBase }
            $r = Neo @((CG 'CG-10.cypher')) ('"libro_id":"' + $libro + '","pelicula_id":"' + $pelicula + '"') $uri
            $unidas = [string](Filas $r)[0][0]
        } catch {
            Paso 'SIMULADO' 'Neo4j' 'CG-10 (el grafo no responde: se apunto a un puerto cerrado; Neo4j NO se detuvo)' 'sin conexion'
            return 'rechazada: el grafo no responde (error recuperable); no se guardo nada'
        }
        Paso 'REAL' 'Neo4j' 'CG-10 existe adaptado_a' $unidas
        if ($unidas -ne 'true') { return 'rechazada: no hay adaptacion entre el libro y la pelicula (RN-06)' }
        # 4. AP-18 (MongoDB)
        $idc = T (100 + $creadas.Count + 1)
        $w = Mongo "try { db.resenas_comparativas.insertOne({_id: '$idc', usuario_id: '$usuario', libro_id: '$libro', pelicula_id: '$pelicula', veredicto: {preferencia: 'libro', comentario: 'comparativa de la integrada'}, aspectos: [{nombre: 'Final', puntuacion: 4}], oculta: false, creado_en: new Date(), actualizado_en: new Date()}); print('creada'); } catch (e) { print('rechazado ' + e.code); }"
        Paso 'REAL' 'MongoDB' 'AP-18 insertar la comparativa' $w.Texto
        if ($w.Texto -eq 'creada') { $creadas.Add($idc); return 'creada' }
        if ($w.Texto -eq 'rechazado 11000') { return 'rechazada: ya existe una comparativa del usuario para la pareja (RN-05)' }
        return 'rechazada: ' + $w.Texto
    }
    function Cuenta-Pareja([string]$libro, [string]$pelicula) {
        return (Mongo "print(db.resenas_comparativas.countDocuments({libro_id: '$libro', pelicula_id: '$pelicula', oculta: false}));").Texto
    }
    try {
        Caso 'INT-06-n1' 'Diego compara Dune con Dune 2021: usuario, fichas y adaptacion validan; se crea y la adaptacion pasa de 2 a 3 comparativas' 'creada; comparativas visibles 2 -> 3' {
            $antes = Cuenta-Pareja $DUNE $DUNE21
            $r = Comparar $DIEGO $DUNE $DUNE21 ''
            $despues = Cuenta-Pareja $DUNE $DUNE21
            Paso 'REAL' 'MongoDB' 'AP-21 comparativas visibles de la pareja antes y despues' "$antes -> $despues"
            "$r; comparativas visibles $antes -> $despues"
        }
        Caso 'INT-06-n2' 'Diego compara Dune con Dune parte dos (otra adaptacion del mismo libro): tambien se crea; RN-05 es por pareja' 'creada; Dune parte dos 1 -> 2' {
            $antes = Cuenta-Pareja $DUNE $DUNE2
            $r = Comparar $DIEGO $DUNE $DUNE2 ''
            $despues = Cuenta-Pareja $DUNE $DUNE2
            "$r; Dune parte dos $antes -> $despues"
        }
        Caso 'INT-06-l1' 'Una ficha en borrador (Neuromante) no se puede comparar aunque tenga adaptado_a: AP-05 informa el estado y se rechaza (criterio del script, a confirmar en la API)' `
             'rechazada: una de las fichas esta en borrador' {
            Comparar $DIEGO (S 'b1' 11) (S 'f1' 12) ''
        }
        Caso 'INT-06-e1' 'Sin adaptacion (Dune con El marciano): CG-10 devuelve false y no se escribe nada (RN-06)' 'rechazada: no hay adaptacion entre el libro y la pelicula (RN-06); comparativas de la pareja 0' {
            $r = Comparar $DIEGO $DUNE (S 'f1' 4) ''
            $n = (Mongo "print(db.resenas_comparativas.countDocuments({libro_id: '$DUNE', pelicula_id: '$(S 'f1' 4)'}));").Texto
            "$r; comparativas de la pareja $n"
        }
        Caso 'INT-06-e2' 'La misma pareja del mismo usuario otra vez (Ana, Dune y Dune 2021): todo valida y el indice unico de MongoDB lo rechaza (RN-05)' `
             'rechazada: ya existe una comparativa del usuario para la pareja (RN-05)' {
            Comparar $ANA $DUNE $DUNE21 ''
        }
        Caso 'INT-06-e3' 'Un usuario que no existe: se rechaza en PostgreSQL sin tocar MongoDB ni Neo4j' 'rechazada: el usuario no existe' {
            Comparar (T 9) $DUNE $DUNE21 ''
        }
        Caso 'INT-06-e4' 'Un libro que no existe: AP-05 lo detecta' 'rechazada: una de las obras no existe' {
            Comparar $DIEGO (T 9) $DUNE21 ''
        }
        Caso 'INT-06-e5' 'El grafo no responde al comprobar la adaptacion (SIMULADO: puerto cerrado): error recuperable y no se guarda nada (fuente-de-verdad, seccion 7)' `
             'rechazada: el grafo no responde (error recuperable); no se guardo nada; comparativas de Diego 3' {
            $r = Comparar $DIEGO $DUNE $DUNE21 'caido'
            $n = (Mongo "print(db.resenas_comparativas.countDocuments({usuario_id: '$DIEGO'}));").Texto
            "$r; comparativas de Diego $n"
        }
    } finally {
        foreach ($c in $creadas) { Mongo "db.resenas_comparativas.deleteOne({_id: '$c'});" | Out-Null }
        $n = (Mongo "print(db.resenas_comparativas.countDocuments());").Texto
        $salida.Add("   Limpieza INT-06: comparativas creadas y borradas: $($creadas.Count); quedan $n en la base (la semilla trae 5)")
    }
}

# ============================================================================================================== INT-07
# Eliminar una cuenta y limpiar las copias (RF-04): PostgreSQL (O4, cascada, trigger) -> [SIMULADO: worker] MongoDB (AP-28) y Neo4j (CG-17).
if (Incluida 'INT-07') {
    Seccion 'INT-07  Eliminar una cuenta y limpiar las copias (RF-04): PostgreSQL (O4) -> [SIMULADO el worker] MongoDB (AP-28) + Neo4j (CG-17)'
    $A = T 1; $B = T 2
    function Preparar-Usuario([string]$u, [int]$k) {
        Pg ("BEGIN; INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES ('$u', 'int07-$k@ejemplo.test', repeat('x', 60), 'Integrada siete $k');" +
            " INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, texto) VALUES (gen_random_uuid(), '$u', '$DUNE', 1, 'resena de la integrada');" +
            " INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES ('$u', '$DUNE', 'terminada');" +
            " INSERT INTO lista (lista_id, usuario_id, nombre) VALUES ('$(T (200 + $k))', '$u', 'Lista de la integrada'); INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES ('$(T (200 + $k))', '$DUNE', 1);" +
            " INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES ('$u', '$ANA'), ('$SOFIA', '$u');" +
            " INSERT INTO sesion (token_hash, usuario_id, expira_en) VALUES (repeat('$k', 64), '$u', now() + interval '1 day'); COMMIT;") | Out-Null
        # las copias, como las habria dejado el worker al procesar usuario_creado, seguimiento_creado y obra_leida (preparacion)
        Neo @((CG 'CG-16.cypher')) ('"usuario_id":"' + $u + '"') | Out-Null
        Neo @((CG 'CG-18-crear.cypher')) ('"seguidor_id":"' + $u + '","seguido_id":"' + $ANA + '"') | Out-Null
        Neo @((CG 'CG-18-crear.cypher')) ('"seguidor_id":"' + $SOFIA + '","seguido_id":"' + $u + '"') | Out-Null
        Neo @((CG 'CG-19-crear.cypher')) ('"usuario_id":"' + $u + '","obra_id":"' + $DUNE + '"') | Out-Null
        Mongo "db.resenas_comparativas.insertOne({_id: '$(T (300 + $k))', usuario_id: '$u', libro_id: '$DUNE', pelicula_id: '$DUNE2', veredicto: {preferencia: 'libro'}, aspectos: [{nombre: 'Ritmo'}], oculta: false, creado_en: new Date(), actualizado_en: new Date()});" | Out-Null
    }
    function O4([string]$u) {
        return Pg "DO `$`$ BEGIN INSERT INTO sync_outbox (tipo_evento, payload) VALUES ('usuario_eliminado', jsonb_build_object('usuario_id', '$u')); DELETE FROM usuario WHERE usuario_id = '$u'; IF NOT FOUND THEN RAISE EXCEPTION 'el usuario no existe'; END IF; END `$`$;"
    }
    function Filas-Pg([string]$u) {
        return (Pg ("SELECT 'resena=' || (SELECT count(*) FROM resena WHERE usuario_id = '$u') || ' estado=' || (SELECT count(*) FROM estado_obra WHERE usuario_id = '$u') || ' lista=' || (SELECT count(*) FROM lista WHERE usuario_id = '$u') || ' seguimiento=' || (SELECT count(*) FROM seguimiento WHERE '$u' IN (seguidor_id, seguido_id)) || ' sesion=' || (SELECT count(*) FROM sesion WHERE usuario_id = '$u');")).Texto
    }
    function Copias([string]$u) {
        $m = (Mongo "print(db.resenas_comparativas.countDocuments({usuario_id: '$u'}));").Texto
        $n = Filas (Neo @("OPTIONAL MATCH (u:Usuario {usuario_id: '$u'}) WITH u OPTIONAL MATCH (u)-[s:sigue]-() WITH u, count(s) AS sigue OPTIONAL MATCH (u)-[l:``$L_LEYO``]->() RETURN count(DISTINCT u), sigue, count(l)") '')
        return "comparativas=$m nodo=$($n[0][0]) sigue=$($n[0][1]) leyo=$($n[0][2])"
    }
    function Coherencia {
        $archivo = Join-Path $tmp 'coherencia.txt'
        cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $raiz 'db\scripts\coherencia.ps1')`" > `"$archivo`" 2>&1"
        $t = [IO.File]::ReadAllText($archivo, $utf8)
        $fallan = @([regex]::Matches($t, '(?m)^FALLA\s+(C-\d+)') | ForEach-Object { $_.Groups[1].Value })
        $pasan = @([regex]::Matches($t, '(?m)^PASA\s+(C-\d+)')).Count
        return @{ Fallan = $fallan; Pasan = $pasan }
    }
    try {
        Preparar-Usuario $A 1
        $dunePrep = (Pg "SELECT promedio || '|' || total_resenas FROM obra_resumen WHERE obra_id = '$DUNE';").Texto
        $salida.Add("   Preparacion: usuario de prueba con resena (calificacion 1 en Dune), estado, lista, 2 seguimientos y sesion en PostgreSQL; nodo con sigue y leyo en Neo4j; una comparativa en MongoDB. Dune queda en $dunePrep (semilla: 4.33|3).")
        Caso 'INT-07-n1' 'O4: una sola transaccion borra al usuario con su cascada, el trigger corrige el promedio de Dune y queda el evento usuario_eliminado' `
             'filas del usuario: resena=0 estado=0 lista=0 seguimiento=0 sesion=0; Dune 4.33|3; evento usuario_eliminado pendiente 1' {
            $r = O4 $A
            Paso 'REAL' 'PostgreSQL' 'O4 (evento + DELETE en una transaccion)' $(if ($r.Codigo -eq 0) { 'confirmada' } else { $r.Texto })
            $f = Filas-Pg $A
            Paso 'REAL' 'PostgreSQL' 'filas que quedan del usuario' $f
            $d = (Pg "SELECT promedio || '|' || total_resenas FROM obra_resumen WHERE obra_id = '$DUNE';").Texto
            Paso 'REAL' 'PostgreSQL' 'promedio de Dune recalculado por el trigger' $d
            $e = (Pg "SELECT count(*) FROM sync_outbox WHERE tipo_evento = 'usuario_eliminado' AND estado = 'pendiente' AND payload->>'usuario_id' = '$A';").Texto
            "filas del usuario: $f; Dune $d; evento usuario_eliminado pendiente $e"
        }
        Caso 'INT-07-n2' 'Entre la respuesta y el procesamiento del evento quedan restos (comparativa y nodo con sus relaciones); la coherencia los detecta' `
             'comparativas=1 nodo=1 sigue=2 leyo=1; la coherencia falla en C-06,C-07,C-08,C-10' {
            $c = Copias $A
            Paso 'REAL' 'MongoDB+Neo4j' 'restos del usuario en las copias (el worker aun no corre)' $c
            $co = Coherencia
            Paso 'REAL' 'coherencia.ps1' 'comprobaciones que fallan' ($co.Fallan -join ', ')
            "$c; la coherencia falla en $($co.Fallan -join ',')"
        }
        Caso 'INT-07-n3' 'SIMULADO: el script aplica el evento (AP-28 y CG-17) y lo marca procesado; las copias quedan limpias y la coherencia vuelve a 13 de 13' `
             'borrados=1; nodo=0; evento procesado 1; coherencia 13 de 13' {
            $m = (Mongo "print('borrados=' + db.resenas_comparativas.deleteMany({usuario_id: '$A'}).deletedCount);").Texto
            Paso 'SIMULADO' 'MongoDB' 'AP-28 borrar las comparativas del usuario' $m
            $n = Neo @((CG 'CG-17.cypher')) ('"usuario_id":"' + $A + '"')
            Paso 'SIMULADO' 'Neo4j' 'CG-17 DETACH DELETE del nodo' $(if ($n.errors.Count -eq 0) { 'ejecutada' } else { $n.errors[0].message })
            $p = (Pg "UPDATE sync_outbox SET estado = 'procesado', procesado_en = now() WHERE tipo_evento = 'usuario_eliminado' AND payload->>'usuario_id' = '$A'; SELECT count(*) FROM sync_outbox WHERE estado = 'procesado' AND payload->>'usuario_id' = '$A';").Texto
            Paso 'SIMULADO' 'PostgreSQL' 'marcar el evento procesado' $p
            $c = Copias $A
            Paso 'REAL' 'MongoDB+Neo4j' 'copias del usuario despues' $c
            $co = Coherencia
            Paso 'REAL' 'coherencia.ps1' 'comprobaciones que pasan / fallan' "$($co.Pasan) / $($co.Fallan -join ',')"
            $nodo = if ($c -match 'nodo=0') { 'nodo=0' } else { $c }
            "$m; $nodo; evento procesado $($p -split "`n" | Select-Object -Last 1); coherencia $($co.Pasan) de $($co.Pasan + $co.Fallan.Count)"
        }
        Caso 'INT-07-l1' 'SIMULADO: procesar el mismo evento otra vez no falla ni borra nada mas (idempotencia de AP-28 y CG-17)' 'borrados=0; CG-17 sin error' {
            $m = (Mongo "print('borrados=' + db.resenas_comparativas.deleteMany({usuario_id: '$A'}).deletedCount);").Texto
            Paso 'SIMULADO' 'MongoDB' 'AP-28 repetido' $m
            $n = Neo @((CG 'CG-17.cypher')) ('"usuario_id":"' + $A + '"')
            Paso 'SIMULADO' 'Neo4j' 'CG-17 repetido' $(if ($n.errors.Count -eq 0) { 'sin error' } else { $n.errors[0].message })
            "$m; CG-17 " + $(if ($n.errors.Count -eq 0) { 'sin error' } else { 'CON error' })
        }
        Preparar-Usuario $B 2
        Caso 'INT-07-l2' 'SIMULADO: un fallo a medias (se aplica AP-28 pero no CG-17) deja el nodo huerfano; el evento sigue pendiente y el reintento termina' `
             'tras AP-28: comparativas=0 nodo=1; reintento CG-17: nodo=0' {
            O4 $B | Out-Null
            $m = (Mongo "print('borrados=' + db.resenas_comparativas.deleteMany({usuario_id: '$B'}).deletedCount);").Texto
            Paso 'SIMULADO' 'MongoDB' 'AP-28 aplicado; CG-17 no se aplica (fallo simulado del destino)' $m
            $c1 = Copias $B
            Paso 'REAL' 'MongoDB+Neo4j' 'copias tras el fallo' $c1
            $ev = (Pg "SELECT estado FROM sync_outbox WHERE tipo_evento = 'usuario_eliminado' AND payload->>'usuario_id' = '$B';").Texto
            Paso 'REAL' 'PostgreSQL' 'estado del evento (no se marco procesado)' $ev
            Neo @((CG 'CG-17.cypher')) ('"usuario_id":"' + $B + '"') | Out-Null
            $c2 = Copias $B
            Paso 'SIMULADO' 'Neo4j' 'reintento de CG-17' $c2
            $a1 = if ($c1 -match 'comparativas=0 nodo=1') { 'comparativas=0 nodo=1' } else { $c1 }
            $a2 = if ($c2 -match 'nodo=0') { 'nodo=0' } else { $c2 }
            "tras AP-28: $a1; reintento CG-17: $a2"
        }
        Caso 'INT-07-e1' 'Eliminar una cuenta que no existe: la transaccion falla y no queda evento' 'P0001; eventos 0' {
            $r = O4 (T 9)
            $cod = Codigo-Pg $r.Texto
            Paso 'REAL' 'PostgreSQL' 'O4 sobre un usuario inexistente' (($r.Texto -replace "`n", ' ').Substring(0, [math]::Min(150, $r.Texto.Length)))
            $e = (Pg "SELECT count(*) FROM sync_outbox WHERE payload->>'usuario_id' = '$(T 9)';").Texto
            "$cod; eventos $e"
        }
    } finally {
        Limpiar-Todo
    }
}

# ============================================================================================================== INT-01
# Alta de una pelicula adaptada, de borrador a publicada (D-24): MongoDB (AP-05/07/08/09/17) + PostgreSQL (O5) + Neo4j (CG-11/13/14/15/03/04/05/20).
if (Incluida 'INT-01') {
    Seccion 'INT-01  Alta de una pelicula adaptada, de borrador a publicada (D-24): MongoDB + PostgreSQL + Neo4j'
    $L = T 10; $P = T 11; $AU = T 12; $DI = T 13; $X1 = T 14; $X2 = T 15; $L2 = T 16; $P2 = T 17; $P3 = T 18; $P4 = T 19
    $FOTO = 'https://almacenamiento.ejemplo.com/personas/integrada-x1.jpg'
    function Ficha-Json([string]$tipo, [string]$id, [string]$titulo) {
        if ($tipo -eq 'libro') { return "{_id: '$id', titulo: '$titulo', sinopsis: 'Sinopsis de la integrada.', generos: ['prueba'], anio_publicacion_original: 2000, ediciones: [], estado_publicacion: 'borrador', creado_en: new Date(), actualizado_en: new Date()}" }
        return "{_id: '$id', titulo: '$titulo', sinopsis: 'Sinopsis de la integrada.', generos: ['prueba'], anio_estreno: 2020, duracion_min: 100, plataformas: [], datos_tecnicos: {idioma_original: 'espanol', paises: ['Mexico']}, reparto: [], estado_publicacion: 'borrador', creado_en: new Date(), actualizado_en: new Date()}"
    }
    function Persona([string]$id, [string]$nombre, [string]$foto) {
        $fotoJson = if ($foto) { '"' + $foto + '"' } else { 'null' }
        Neo @((CG 'CG-13.cypher')) ('"persona_id":"' + $id + '","nombre":"' + $nombre + '","foto_url":' + $fotoJson) | Out-Null
    }
    function Vinculo([string]$archivo, [string]$persona, [string]$obra, [string]$extra) {
        $r = Neo @((CG $archivo)) ('"persona_id":"' + $persona + '","obra_id":"' + $obra + '"' + $extra)
        return (Filas $r).Count
    }
    # Alta del libro (paso previo): el libro termina en borrador (D-24)
    function Alta-Libro([string]$id, [string]$titulo, [string]$autor) {
        $m = Mongo "const e = db.libros.findOne({_id: '$id'}); if (!e) { db.libros.insertOne($(Ficha-Json 'libro' $id $titulo)); print('creada'); } else { print('ya existia'); }"
        Paso 'REAL' 'MongoDB' 'AP-05 + AP-07 ficha del libro en borrador' $m.Texto
        $o = (Pg "INSERT INTO obra_resumen (obra_id, tipo) VALUES ('$id', 'libro') ON CONFLICT (obra_id) DO NOTHING; SELECT count(*) FROM obra_resumen WHERE obra_id = '$id';").Texto
        Paso 'REAL' 'PostgreSQL' 'O5 registrar obra (idempotente)' ($o -replace "`n", ' ')
        Neo @((CG 'CG-11-libro.cypher')) ('"obra_id":"' + $id + '"') | Out-Null
        Paso 'REAL' 'Neo4j' 'CG-11 nodo Libro' 'ok'
        Persona $autor 'Autora de la integrada' ''
        $n = Vinculo 'CG-14-escribio.cypher' $autor $id ''
        Paso 'REAL' 'Neo4j' 'CG-13 persona + CG-14 escribio' "relaciones nuevas=$n"
    }
    # Alta de la pelicula: devuelve un texto con lo ocurrido
    function Alta-Pelicula([string]$id, [string]$libro, [string]$titulo, [bool]$conReparto, [bool]$interrumpir) {
        # 1. AP-05 del libro de origen + AP-08 ficha en borrador (si no existe)
        $m = Mongo "const l = db.libros.findOne({_id: '$libro'}, {estado_publicacion: 1}); if (!l) { print('LIBRO_NO_EXISTE'); } else { const e = db.peliculas.findOne({_id: '$id'}); if (!e) { db.peliculas.insertOne($(Ficha-Json 'pelicula' $id $titulo)); print('libro=' + l.estado_publicacion + ';pelicula=creada'); } else { print('libro=' + l.estado_publicacion + ';pelicula=ya existia'); } }"
        Paso 'REAL' 'MongoDB' 'AP-05 libro de origen + AP-08 ficha de pelicula en borrador' $m.Texto
        if ($m.Texto -eq 'LIBRO_NO_EXISTE') { return 'rechazada: el libro de origen no existe; no se escribio nada' }
        # 2. O5
        $o = (Pg "INSERT INTO obra_resumen (obra_id, tipo) VALUES ('$id', 'pelicula') ON CONFLICT (obra_id) DO NOTHING; SELECT count(*) FROM obra_resumen WHERE obra_id = '$id';").Texto
        Paso 'REAL' 'PostgreSQL' 'O5 registrar obra (idempotente)' ($o -replace "`n", ' ')
        if ($interrumpir) { return 'interrumpida despues de O5' }
        # 3. grafo: nodo, adaptacion (D-23), director y reparto
        Neo @((CG 'CG-11-pelicula.cypher')) ('"obra_id":"' + $id + '"') | Out-Null
        $adap = Neo-Adaptacion $libro $id
        Paso 'REAL' 'Neo4j' 'CG-11 nodo + CG-15-bloqueo + CG-04 + CG-15 en una transaccion (D-23)' $adap
        Persona $DI 'Director de la integrada' ''
        $d = Vinculo 'CG-14-dirigio.cypher' $DI $id ''
        Paso 'REAL' 'Neo4j' 'CG-13 persona + CG-14 dirigida_por' "relaciones nuevas=$d"
        if ($conReparto) {
            Persona $X1 'Actor con foto' $FOTO
            Persona $X2 'Actor sin foto' ''
            $a1 = Vinculo 'CG-14-actuo.cypher' $X1 $id ',"personaje":"Protagonista","orden":1'
            $a2 = Vinculo 'CG-14-actuo.cypher' $X2 $id ',"personaje":"Secundario","orden":2'
            Paso 'REAL' 'Neo4j' 'CG-13 + CG-14 actuo_en (2 actores)' "relaciones nuevas=$a1,$a2"
        }
        # 4. CG-20 y minimo de D-24
        $rep = Filas (Neo @((CG 'CG-20.cypher')) ('"pelicula_id":"' + $id + '"'))
        $repJson = '[' + (($rep | ForEach-Object {
            $f = ''; if ($null -ne $_[2]) { $f = ', foto_url: "' + $_[2] + '"' }
            '{persona_id: "' + $_[0] + '", nombre: "' + $_[1] + '", personaje: "' + $_[3] + '", orden: ' + $_[4] + $f + '}' }) -join ',') + ']'
        Paso 'REAL' 'Neo4j' 'CG-20 reparto leido del grafo' "$($rep.Count) personas"
        $nLibro = (Filas (Neo @((CG 'CG-04.cypher')) ('"pelicula_id":"' + $id + '"'))).Count
        $nDir = (Filas (Neo @((CG 'CG-05.cypher')) ('"obra_id":"' + $id + '"'))).Count
        $nLibroAdap = (Filas (Neo @((CG 'CG-03.cypher')) ('"libro_id":"' + $libro + '"'))).Count
        $nAut = (Filas (Neo @((CG 'CG-05.cypher')) ('"obra_id":"' + $libro + '"'))).Count
        Paso 'REAL' 'Neo4j' 'minimo de D-24 (CG-04, CG-05, CG-20; del libro: CG-03 y CG-05)' "libro de origen=$nLibro directores=$nDir reparto=$($rep.Count); libro: adaptaciones=$nLibroAdap autores=$nAut"
        $cumple = ($nLibro -eq 1 -and $nDir -ge 1 -and $rep.Count -ge 1 -and $nLibroAdap -ge 1 -and $nAut -ge 1)
        # 5. AP-17 (copia del reparto) y, si cumple el minimo, AP-09 del libro y de la pelicula
        $publicar = if ($cumple) { 'true' } else { 'false' }
        $w = Mongo "db.peliculas.updateOne({_id: '$id'}, {`$set: {reparto: $repJson, actualizado_en: new Date()}}); let pub = 'no cumple el minimo: queda en borrador'; if ($publicar) { db.libros.updateOne({_id: '$libro', estado_publicacion: 'borrador'}, {`$set: {estado_publicacion: 'publicada', actualizado_en: new Date()}}); db.peliculas.updateOne({_id: '$id', estado_publicacion: 'borrador'}, {`$set: {estado_publicacion: 'publicada', actualizado_en: new Date()}}); pub = 'publicada'; } const p = db.peliculas.findOne({_id: '$id'}); const l = db.libros.findOne({_id: '$libro'}); print('libro=' + l.estado_publicacion + ';pelicula=' + p.estado_publicacion + ';reparto=' + p.reparto.length + ';' + pub);"
        Paso 'REAL' 'MongoDB' 'AP-17 copiar el reparto + AP-09 publicar libro y pelicula (solo si cumple el minimo)' $w.Texto
        return $w.Texto
    }
    function Estado-Ficha([string]$coleccion, [string]$id) {
        return (Mongo "const d = db.getCollection('$coleccion').findOne({_id: '$id'}); print(d ? d.estado_publicacion + '|' + (d.reparto ? d.reparto.length : '-') : 'no existe');").Texto
    }
    try {
        Caso 'INT-01-n1' 'Alta del libro: queda en borrador, con autor pero sin adaptacion; no cumple el minimo y NO se publica (el alta de su primera pelicula lo publica, D-24)' `
             'libro borrador|0; autores=1 adaptaciones=0; no publicable' {
            Alta-Libro $L 'Libro de la integrada' $AU
            $est = Estado-Ficha 'libros' $L
            $aut = (Filas (Neo @((CG 'CG-05.cypher')) ('"obra_id":"' + $L + '"'))).Count
            $ada = (Filas (Neo @((CG 'CG-03.cypher')) ('"libro_id":"' + $L + '"'))).Count
            Paso 'REAL' 'Neo4j' 'CG-05 autores y CG-03 adaptaciones del libro' "autores=$aut adaptaciones=$ada"
            $vis = (Mongo "print(db.libros.countDocuments({`$text: {`$search: 'integrada'}, estado_publicacion: 'publicada'}));").Texto
            Paso 'REAL' 'MongoDB' 'AP-03 un visitante busca "integrada" (solo publicadas)' "$vis resultados"
            "libro $($est -replace '\|\-', '|0'); autores=$aut adaptaciones=$ada; " + $(if ($ada -ge 1) { 'publicable' } else { 'no publicable' })
        }
        Caso 'INT-01-n2' 'Alta de la pelicula con libro de origen, director y 2 actores: se copia el reparto y se publican el libro y la pelicula; la coherencia entre bases sigue en 13 de 13' `
             'libro=publicada;pelicula=publicada;reparto=2;publicada; coherencia 13 de 13' {
            $r = Alta-Pelicula $P $L 'Pelicula de la integrada' $true $false
            $m = (Mongo "print(db.libros.countDocuments({`$text: {`$search: 'integrada'}, estado_publicacion: 'publicada'}) + ' libros, ' + db.peliculas.countDocuments({`$text: {`$search: 'integrada'}, estado_publicacion: 'publicada'}) + ' peliculas');").Texto
            Paso 'REAL' 'MongoDB' 'AP-03 un visitante busca "integrada" ahora' $m
            $archivo = Join-Path $tmp 'coherencia.txt'
            cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $raiz 'db\scripts\coherencia.ps1')`" > `"$archivo`" 2>&1"
            $t = [IO.File]::ReadAllText($archivo, $utf8)
            $pasan = @([regex]::Matches($t, '(?m)^PASA\s+C-\d+')).Count; $fallan = @([regex]::Matches($t, '(?m)^FALLA\s+C-\d+')).Count
            Paso 'REAL' 'coherencia.ps1' 'con la obra nueva dentro de las tres bases' "$pasan pasan, $fallan fallan"
            "$r; coherencia $pasan de $($pasan + $fallan)"
        }
        Caso 'INT-01-l1' 'D-27: la foto del actor se copia al reparto de la ficha; el actor sin foto no lleva el campo' 'actor 1 con foto igual a la del nodo; actor 2 sin foto_url' {
            $m = Mongo "const p = db.peliculas.findOne({_id: '$P'}); print(JSON.stringify(p.reparto.map(r => ({orden: r.orden, foto: r.foto_url === undefined ? null : r.foto_url}))));"
            Paso 'REAL' 'MongoDB' 'reparto de la ficha' $m.Texto
            $tj = $m.Texto | ConvertFrom-Json; $rep = @($tj | ForEach-Object { $_ })
            $nodo = [string](Filas (Neo @("MATCH (p:Persona {persona_id: '$X1'}) RETURN p.foto_url") ''))[0][0]
            Paso 'REAL' 'Neo4j' 'foto_url del nodo del actor 1' $nodo
            $a = if ($rep[0].foto -ceq $nodo) { 'actor 1 con foto igual a la del nodo' } else { 'actor 1 DISTINTO' }
            $b = if ($null -eq $rep[1].foto) { 'actor 2 sin foto_url' } else { 'actor 2 CON foto' }
            "$a; $b"
        }
        Caso 'INT-01-l2' 'Una pelicula sin reparto NO cumple el minimo: el script no la publica, queda en borrador y la reconciliacion (CG-22) la senala' `
             'libro=publicada;pelicula=borrador;reparto=0;no cumple el minimo: queda en borrador; CG-22: libro=1 directores=1 reparto=0' {
            Neo @((CG 'CG-11-libro.cypher')) ('"obra_id":"' + $L + '"') | Out-Null
            $r = Alta-Pelicula $P2 $L 'Pelicula sin reparto de la integrada' $false $false
            $c = Filas (Neo @((CG 'CG-22.cypher')) '')
            $fila = @($c | Where-Object { $_[1] -eq $P2 })[0]
            Paso 'REAL' 'Neo4j' 'CG-22 cuentas de la pelicula (n1=libros de origen, n2=directores, n3=reparto)' "$($fila[2]), $($fila[3]), $($fila[4])"
            "$r; CG-22: libro=$($fila[2]) directores=$($fila[3]) reparto=$($fila[4])"
        }
        Caso 'INT-01-l3' 'Un alta interrumpida (tras AP-08 y O5) deja la ficha en borrador; repetir los pasos (SIMULADO: es lo que hara la reconciliacion) los completa sin duplicar' `
             'tras interrumpir: borrador|0; tras reintentar: libro=publicada;pelicula=publicada;reparto=2;publicada; 1 fila en obra_resumen' {
            $r1 = Alta-Pelicula $P3 $L 'Pelicula interrumpida de la integrada' $true $true
            $e1 = Estado-Ficha 'peliculas' $P3
            Paso 'REAL' 'MongoDB' 'estado de la ficha tras la interrupcion' $e1
            $r2 = Alta-Pelicula $P3 $L 'Pelicula interrumpida de la integrada' $true $false
            $filas = (Pg "SELECT count(*) FROM obra_resumen WHERE obra_id = '$P3';").Texto
            "tras interrumpir: $($e1 -replace '\|\-', '|0'); tras reintentar: $r2; $filas fila en obra_resumen"
        }
        Caso 'INT-01-e1' 'Un segundo libro de origen para una pelicula que ya tiene uno (RN-07): con el protocolo de D-23 se rechaza y no se llama a CG-15' `
             'rechazada: la pelicula ya tiene libro de origen (RN-07); no se llamo a CG-15; libros de origen 1' {
            Alta-Libro $L2 'Segundo libro de la integrada' $AU
            $r = Neo-Adaptacion $L2 $P
            Paso 'REAL' 'Neo4j' 'CG-15-bloqueo + CG-04 + (CG-15 no se llama)' $r
            $n = (Filas (Neo @((CG 'CG-04.cypher')) ('"pelicula_id":"' + $P + '"'))).Count
            "$r; libros de origen $n"
        }
        Caso 'INT-01-e2' 'Una pelicula cuyo libro de origen no existe: AP-05 lo detecta y no se escribe nada en ninguna base' `
             'rechazada: el libro de origen no existe; no se escribio nada; ficha 0 obra_resumen 0 nodo 0' {
            $r = Alta-Pelicula $P4 (T 99) 'Pelicula huerfana' $true $false
            $f = (Mongo "print(db.peliculas.countDocuments({_id: '$P4'}));").Texto
            $o = (Pg "SELECT count(*) FROM obra_resumen WHERE obra_id = '$P4';").Texto
            $n = [string](Filas (Neo @("MATCH (f:``$L_PELICULA`` {obra_id: '$P4'}) RETURN count(f)") ''))[0][0]
            Paso 'REAL' 'las tres' 'lo que quedo escrito' "ficha $f, obra_resumen $o, nodo $n"
            "$r; ficha $f obra_resumen $o nodo $n"
        }
    } finally {
        Limpiar-Todo
        $f = (Mongo "print(db.libros.countDocuments() + '|' + db.peliculas.countDocuments());").Texto
        $salida.Add("   Limpieza INT-01: fichas que quedan en MongoDB (libros|peliculas): $f (la semilla trae 11|12)")
    }
}

# ---------------------------------------------------------------- cierre: la semilla debe estar intacta
$salida.Add('')
$salida.Add('=' * 110)
$salida.Add('Comprobacion final: coherencia entre las tres bases')
$salida.Add('=' * 110)
$archivo = Join-Path $tmp 'coherencia-final.txt'
cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $raiz 'db\scripts\coherencia.ps1')`" > `"$archivo`" 2>&1"
$codCoh = $LASTEXITCODE
$tc = [IO.File]::ReadAllText($archivo, $utf8)
$ultima = ($tc -split "`n" | Where-Object { $_ -match 'comprobaciones pasan|fallan|Todo cuadra' } | Select-Object -Last 1)
$salida.Add("coherencia.ps1: codigo $codCoh; $ultima")
$totales = $resultados.Count
$okc = @($resultados.Keys | Where-Object { $resultados[$_] }).Count
$salida.Add('')
$salida.Add("Casos integrados: $okc de $totales pasan.")
[IO.File]::WriteAllLines((Join-Path $destino 'integradas.txt'), [string[]]$salida, $utf8)
Write-Host "`nCasos integrados: $okc de $totales pasan. Coherencia final: codigo $codCoh"
if ($okc -ne $totales -or $codCoh -ne 0) { exit 1 }
exit 0
