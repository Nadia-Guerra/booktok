# Genera los tres cargadores de la semilla a partir de db/semilla/semilla.json (la unica fuente):
#   db/relacional/04-semilla.sql   (PostgreSQL)
#   db/documental/03-semilla.js    (MongoDB)
#   db/grafo/02-semilla.cypher     (Neo4j)
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los archivos que genera, que si las
#  llevan, se escriben en UTF-8 sin BOM y con saltos de linea LF.)
#
# Uso:   .\db\semilla\generar.ps1              valida la fuente y escribe los tres archivos
#        .\db\semilla\generar.ps1 -Verificar   valida y compara con los archivos que hay en disco, sin escribir
# Codigo de salida: 0 si todo bien, 1 si la fuente no es valida o (con -Verificar) si los archivos no estan al dia.
#
# Antes de escribir nada comprueba la fuente: ids UUID en minusculas, referencias, los minimos de D-24, RN-06, RN-07,
# RF-13 (toda resena tiene su estado "terminada") y que cada dato quede igual en las tres bases (RNF-08).
# No hay datos derivados a mano: el promedio de las obras lo calcula el trigger al cargar (RN-08); el reparto de
# cada ficha se copia de actuo_en (D-12, D-27) y leyo se deriva de los estados "terminada" de libros (D-16).

param([switch]$Verificar)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$utf8 = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Web.Extensions

# ------------------------------------------------------------------ lectura
# JavaScriptSerializer devuelve diccionarios (ContainsKey para los campos opcionales) y deja fechas, numeros y booleanos
# como texto, entero y bool, sin conversiones.
$ruta = Join-Path $PSScriptRoot 'semilla.json'
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$d = $ser.DeserializeObject([IO.File]::ReadAllText($ruta, $utf8))

function Opc($o, [string]$k) { if ($o.ContainsKey($k)) { return $o[$k] } else { return $null } }
function Lista($k) { if ($d.ContainsKey($k)) { return @($d[$k]) } else { return @() } }

$usuarios = Lista 'usuarios'; $personas = Lista 'personas'; $libros = Lista 'libros'; $peliculas = Lista 'peliculas'
$escribio = Lista 'escribio'; $adaptado = Lista 'adaptado_a'; $dirigida = Lista 'dirigida_por'; $actuo = Lista 'actuo_en'
$resenas = Lista 'resenas'; $estados = Lista 'estados'; $seguimientos = Lista 'seguimientos'
$listas = Lista 'listas'; $comparativas = Lista 'comparativas'

# --------------------------------------------------------------- validacion
$errores = New-Object System.Collections.Generic.List[string]
function Fallar([string]$m) { $errores.Add($m) }
$reUuid = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
$reFecha = '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$'
$reHttps = '^https://\S+$'

function IdValido($id, [string]$donde) {
    if (-not ($id -is [string]) -or $id -cnotmatch $reUuid) { Fallar "$donde : '$id' no es un UUID en minusculas con guiones"; return $false }
    return $true
}
function Indice($items, [string]$campo, [string]$nombre) {
    $m = @{}
    foreach ($i in $items) {
        $id = $i[$campo]
        if (IdValido $id "$nombre.$campo") {
            if ($m.ContainsKey($id)) { Fallar "$nombre : id repetido $id" } else { $m[$id] = $i }
        }
    }
    return $m
}
function Fecha($v, [string]$donde) {
    if (-not ($v -is [string]) -or $v -cnotmatch $reFecha) { Fallar "$donde : fecha invalida '$v' (formato 2026-11-03T18:00:00Z)" }
}

$uUsuario = Indice $usuarios 'id' 'usuarios'
$uPersona = Indice $personas 'id' 'personas'
$uLibro = Indice $libros 'id' 'libros'
$uPelicula = Indice $peliculas 'id' 'peliculas'
foreach ($id in $uLibro.Keys) { if ($uPelicula.ContainsKey($id)) { Fallar "obra_id repetido entre libro y pelicula: $id" } }
function EsObra($id) { return ($uLibro.ContainsKey($id) -or $uPelicula.ContainsKey($id)) }
function Obra($id) { if ($uLibro.ContainsKey($id)) { return $uLibro[$id] } else { return $uPelicula[$id] } }
function Publicada($id) { return ((Obra $id)['estado_publicacion'] -ceq 'publicada') }

$correos = @{}; $admins = 0
foreach ($u in $usuarios) {
    $c = $u['correo']
    if ($c -cne $c.ToLower()) { Fallar "usuario $($u['id']): el correo debe estar en minusculas (D-03)" }
    if ($correos.ContainsKey($c)) { Fallar "correo repetido: $c" } else { $correos[$c] = 1 }
    if (@('lector', 'admin') -cnotcontains $u['rol']) { Fallar "usuario $($u['id']): rol invalido '$($u['rol'])'" }
    if ($u['rol'] -ceq 'admin') { $admins++ }
    if (-not $u['password_hash']) { Fallar "usuario $($u['id']): falta password_hash" }
    Fecha $u['creado_en'] "usuario $($u['id']).creado_en"
}
if ($admins -lt 1) { Fallar 'La semilla debe crear al menos un administrador' }

foreach ($p in $personas) { $f = Opc $p 'foto_url'; if ($f -and $f -cnotmatch $reHttps) { Fallar "persona $($p['id']): foto_url debe empezar por https://" } }

$isbns = @{}
function IsbnValido([string]$i) {
    if ($i -cnotmatch '^[0-9]{13}$') { return $false }
    $s = 0
    for ($k = 0; $k -lt 12; $k++) { $s += ([int][string]$i[$k]) * $(if ($k % 2 -eq 0) { 1 } else { 3 }) }
    return ((10 - ($s % 10)) % 10) -eq [int][string]$i[12]
}
$edIds = @{}
foreach ($o in @($libros) + @($peliculas)) {
    if (@('borrador', 'publicada') -cnotcontains $o['estado_publicacion']) { Fallar "obra $($o['id']): estado_publicacion invalido" }
    Fecha $o['creado_en'] "obra $($o['id']).creado_en"; Fecha $o['actualizado_en'] "obra $($o['id']).actualizado_en"
    $pu = Opc $o 'portada_url'; if ($pu -and $pu -cnotmatch $reHttps) { Fallar "obra $($o['id']): portada_url debe empezar por https://" }
}
foreach ($l in $libros) {
    foreach ($e in @($l['ediciones'])) {
        if (IdValido $e['edicion_id'] "libro $($l['id']).edicion_id") {
            if ($edIds.ContainsKey($e['edicion_id'])) { Fallar "edicion_id repetido: $($e['edicion_id'])" } else { $edIds[$e['edicion_id']] = 1 }
        }
        $i = Opc $e 'isbn'
        if ($i) {
            if (-not (IsbnValido $i)) { Fallar "libro $($l['id']): ISBN invalido $i (13 digitos y digito de control)" }
            if ($isbns.ContainsKey($i)) { Fallar "ISBN repetido entre libros: $i" } else { $isbns[$i] = 1 }
        }
    }
}

# Relaciones del grafo
$refOk = { param($mapa, $id, $donde) if (-not $mapa.ContainsKey($id)) { Fallar "$donde : no existe $id" } }
$autores = @{}; $adapts = @{}; $origen = @{}; $directores = @{}; $reparto = @{}; $pares = @{}
foreach ($r in $escribio) {
    & $refOk $uPersona $r['persona'] 'escribio.persona'; & $refOk $uLibro $r['libro'] 'escribio.libro'
    $k = "e|$($r['persona'])|$($r['libro'])"; if ($pares.ContainsKey($k)) { Fallar "escribio repetido: $k" }; $pares[$k] = 1
    $autores[$r['libro']] = 1 + [int]$autores[$r['libro']]
}
foreach ($r in $adaptado) {
    & $refOk $uLibro $r['libro'] 'adaptado_a.libro'; & $refOk $uPelicula $r['pelicula'] 'adaptado_a.pelicula'
    $k = "a|$($r['libro'])|$($r['pelicula'])"; if ($pares.ContainsKey($k)) { Fallar "adaptado_a repetido: $k" }; $pares[$k] = 1
    $adapts[$r['libro']] = 1 + [int]$adapts[$r['libro']]
    $origen[$r['pelicula']] = 1 + [int]$origen[$r['pelicula']]
}
foreach ($r in $dirigida) {
    & $refOk $uPelicula $r['pelicula'] 'dirigida_por.pelicula'; & $refOk $uPersona $r['persona'] 'dirigida_por.persona'
    $k = "d|$($r['pelicula'])|$($r['persona'])"; if ($pares.ContainsKey($k)) { Fallar "dirigida_por repetido: $k" }; $pares[$k] = 1
    $directores[$r['pelicula']] = 1 + [int]$directores[$r['pelicula']]
}
$ordenes = @{}
foreach ($r in $actuo) {
    & $refOk $uPersona $r['persona'] 'actuo_en.persona'; & $refOk $uPelicula $r['pelicula'] 'actuo_en.pelicula'
    $k = "c|$($r['persona'])|$($r['pelicula'])"; if ($pares.ContainsKey($k)) { Fallar "actuo_en repetido (D-19): $k" }; $pares[$k] = 1
    $ko = "$($r['pelicula'])|$($r['orden'])"; if ($ordenes.ContainsKey($ko)) { Fallar "orden $($r['orden']) repetido en la pelicula $($r['pelicula'])" }; $ordenes[$ko] = 1
    if (-not ($r['orden'] -is [int]) -or $r['orden'] -lt 1) { Fallar "actuo_en $k : orden debe ser un entero desde 1" }
    if (-not $r['personaje']) { Fallar "actuo_en $k : falta personaje" }
    $reparto[$r['pelicula']] = 1 + [int]$reparto[$r['pelicula']]
}
# RN-07 y D-24
foreach ($id in $uPelicula.Keys) {
    if ([int]$origen[$id] -gt 1) { Fallar "RN-07: la pelicula $id tiene mas de un libro de origen" }
    if ([int]$reparto[$id] -gt 300) { Fallar "D-24: la pelicula $id supera los 300 del reparto" }
    if ($uPelicula[$id]['estado_publicacion'] -ceq 'publicada') {
        if ([int]$origen[$id] -ne 1) { Fallar "D-24: la pelicula publicada $id necesita exactamente un libro de origen" }
        if ([int]$directores[$id] -lt 1) { Fallar "D-24: la pelicula publicada $id necesita al menos un director" }
        if ([int]$reparto[$id] -lt 1) { Fallar "D-24: la pelicula publicada $id necesita al menos una persona en el reparto" }
    }
}
foreach ($id in $uLibro.Keys) {
    if ($uLibro[$id]['estado_publicacion'] -ceq 'publicada') {
        if ([int]$autores[$id] -lt 1) { Fallar "D-24: el libro publicado $id necesita al menos un autor" }
        if ([int]$adapts[$id] -lt 1) { Fallar "D-24: el libro publicado $id necesita al menos una adaptacion" }
    }
}

# Relacional
$estadoDe = @{}
foreach ($e in $estados) {
    & $refOk $uUsuario $e['usuario'] 'estados.usuario'
    if (-not (EsObra $e['obra'])) { Fallar "estados.obra : no existe $($e['obra'])"; continue }
    if (-not (Publicada $e['obra'])) { Fallar "estados : la obra $($e['obra']) es un borrador y no puede tener estado" }
    if (@('pendiente', 'en_curso', 'terminada') -cnotcontains $e['estado']) { Fallar "estados : estado invalido '$($e['estado'])'" }
    $k = "$($e['usuario'])|$($e['obra'])"; if ($estadoDe.ContainsKey($k)) { Fallar "estados repetido: $k" }; $estadoDe[$k] = $e['estado']
    Fecha $e['actualizado_en'] "estados $k"
}
$resDe = @{}
foreach ($r in $resenas) {
    IdValido $r['id'] 'resenas.id' | Out-Null
    & $refOk $uUsuario $r['usuario'] 'resenas.usuario'
    if (-not (EsObra $r['obra'])) { Fallar "resenas.obra : no existe $($r['obra'])"; continue }
    if (-not (Publicada $r['obra'])) { Fallar "resenas : la obra $($r['obra']) es un borrador y no puede tener resenas" }
    if (-not ($r['calificacion'] -is [int]) -or $r['calificacion'] -lt 1 -or $r['calificacion'] -gt 5) { Fallar "resenas $($r['id']): calificacion de 1 a 5 (RN-02)" }
    $k = "$($r['usuario'])|$($r['obra'])"; if ($resDe.ContainsKey($k)) { Fallar "RN-01: dos resenas del mismo usuario y obra: $k" }; $resDe[$k] = 1
    if ($estadoDe[$k] -cne 'terminada') { Fallar "RF-13: la resena $($r['id']) no tiene el estado 'terminada' de ese usuario y obra" }
    Fecha $r['creado_en'] "resenas $($r['id'])"
}
$segDe = @{}
foreach ($s in $seguimientos) {
    & $refOk $uUsuario $s['seguidor'] 'seguimientos.seguidor'; & $refOk $uUsuario $s['seguido'] 'seguimientos.seguido'
    if ($s['seguidor'] -ceq $s['seguido']) { Fallar "RN-03: $($s['seguidor']) se sigue a si mismo" }
    $k = "$($s['seguidor'])|$($s['seguido'])"; if ($segDe.ContainsKey($k)) { Fallar "seguimiento repetido: $k" }; $segDe[$k] = 1
}
$listaIds = @{}
foreach ($l in $listas) {
    IdValido $l['id'] 'listas.id' | Out-Null
    if ($listaIds.ContainsKey($l['id'])) { Fallar "lista repetida: $($l['id'])" }; $listaIds[$l['id']] = 1
    & $refOk $uUsuario $l['usuario'] 'listas.usuario'
    $vistas = @{}
    foreach ($o in @($l['obras'])) {
        if (-not (EsObra $o)) { Fallar "lista $($l['id']): no existe la obra $o"; continue }
        if (-not (Publicada $o)) { Fallar "lista $($l['id']): la obra $o es un borrador" }
        if ($vistas.ContainsKey($o)) { Fallar "RN-04: obra repetida en la lista $($l['id']): $o" }; $vistas[$o] = 1
    }
}

# Documental
$compDe = @{}
foreach ($c in $comparativas) {
    IdValido $c['id'] 'comparativas.id' | Out-Null
    & $refOk $uUsuario $c['usuario'] 'comparativas.usuario'; & $refOk $uLibro $c['libro'] 'comparativas.libro'; & $refOk $uPelicula $c['pelicula'] 'comparativas.pelicula'
    if (-not $pares.ContainsKey("a|$($c['libro'])|$($c['pelicula'])")) { Fallar "RN-06: la comparativa $($c['id']) une un libro y una pelicula sin adaptado_a" }
    $k = "$($c['usuario'])|$($c['libro'])|$($c['pelicula'])"; if ($compDe.ContainsKey($k)) { Fallar "RN-05: comparativa repetida: $k" }; $compDe[$k] = 1
    if (@('libro', 'pelicula', 'empate') -cnotcontains $c['preferencia']) { Fallar "comparativas $($c['id']): preferencia invalida" }
    if (@($c['aspectos']).Count -lt 1) { Fallar "comparativas $($c['id']): necesita al menos un aspecto" }
    Fecha $c['creado_en'] "comparativas $($c['id'])"
}

if ($errores.Count -gt 0) {
    Write-Host "La fuente no es valida ($($errores.Count) problema(s)):" -ForegroundColor Red
    foreach ($e in $errores) { Write-Host "  - $e" -ForegroundColor Red }
    exit 1
}

# ------------------------------------------------------------------- ayudas de escritura
function Sql($v) {
    if ($null -eq $v) { return 'NULL' }
    if ($v -is [bool]) { if ($v) { return 'true' } else { return 'false' } }
    if ($v -is [int]) { return [string]$v }
    return "'" + ([string]$v).Replace("'", "''") + "'"
}
function JsStr([string]$s) { return '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }
function CyStr([string]$s) { return "'" + $s.Replace('\', '\\').Replace("'", "\'") + "'" }
function Fch([string]$s) { return [ordered]@{ '__fecha' = $s } }

# Texto JavaScript de un valor (objetos y arreglos con sangria; los pequenos, en una linea)
function Js($v, [int]$nivel) {
    $ind = '  ' * ($nivel + 1); $fin = '  ' * $nivel
    if ($null -eq $v) { return 'null' }
    if ($v -is [bool]) { if ($v) { return 'true' } else { return 'false' } }
    if ($v -is [int]) { return [string]$v }
    if ($v -is [string]) { return (JsStr $v) }
    if ($v -is [System.Collections.IDictionary]) {
        if ($v.Contains('__fecha')) { return 'new Date(' + (JsStr $v['__fecha']) + ')' }
        if ($v.Count -eq 0) { return '{}' }
        $en = (@(foreach ($k in $v.Keys) { $k + ': ' + (Js $v[$k] ($nivel + 1)) })) -join ', '
        if ($en.Length -le 110 -and $en.IndexOf("`n") -lt 0) { return '{ ' + $en + ' }' }
        $lineas = @(foreach ($k in $v.Keys) { $ind + $k + ': ' + (Js $v[$k] ($nivel + 1)) })
        return "{`n" + ($lineas -join ",`n") + "`n" + $fin + '}'
    }
    $items = @($v)
    if ($items.Count -eq 0) { return '[]' }
    $compuestos = @($items | Where-Object { $_ -is [System.Collections.IDictionary] -and -not $_.Contains('__fecha') })
    if ($compuestos.Count -eq 0) { return '[' + ((@($items | ForEach-Object { Js $_ ($nivel + 1) })) -join ', ') + ']' }
    $lineas = @(foreach ($i in $items) { $ind + (Js $i ($nivel + 1)) })
    return "[`n" + ($lineas -join ",`n") + "`n" + $fin + ']'
}

# Reparto de una pelicula, copiado de actuo_en (D-12, D-27): persona_id, nombre, personaje, orden y foto_url si la tiene
function RepartoDe([string]$peliculaId) {
    $filas = @($actuo | Where-Object { $_['pelicula'] -ceq $peliculaId } | Sort-Object { $_['orden'] })
    return @(foreach ($a in $filas) {
        $p = $uPersona[$a['persona']]
        $item = [ordered]@{ persona_id = $a['persona']; nombre = $p['nombre']; personaje = $a['personaje']; orden = $a['orden'] }
        $f = Opc $p 'foto_url'; if ($f) { $item['foto_url'] = $f }
        $item
    })
}

$leyoPares = @($estados | Where-Object { $_['estado'] -ceq 'terminada' -and $uLibro.ContainsKey($_['obra']) })

$cabecera = @(
    'ARCHIVO GENERADO: no lo edites a mano.',
    'Fuente unica: db/semilla/semilla.json. Regenerar con: powershell -File db\semilla\generar.ps1',
    'Descripcion y escenarios: db/semilla/README.md'
)

# ============================================================== relacional
$sql = New-Object System.Collections.Generic.List[string]
foreach ($c in $cabecera) { $sql.Add('-- ' + $c) }
$sql.Add('-- Se puede repetir: vacia las tablas y vuelve a cargar. Requiere 01-esquema.sql, 02-indices.sql y 03-trigger.sql.')
$sql.Add('-- promedio y total_resenas NO se escriben: los calcula el trigger al insertar cada resena (RN-08, RF-13).')
$sql.Add('-- Las contrasenas son hashes bcrypt (pgcrypto, coste 10); la contrasena de prueba esta en db/semilla/README.md.')
$sql.Add('')
$sql.Add('\set ON_ERROR_STOP on')
$sql.Add('SET client_min_messages = warning;')
$sql.Add('')
$sql.Add('BEGIN;')
$sql.Add('')
$sql.Add('TRUNCATE sesion, sync_outbox, seguimiento, elemento_lista, lista, estado_obra, resena, obra_resumen, usuario RESTART IDENTITY;')
$sql.Add('')
$sql.Add('INSERT INTO usuario (usuario_id, correo, password_hash, nombre, biografia, rol, creado_en) VALUES')
$sql.Add((@(foreach ($u in $usuarios) {
    '    (' + (Sql $u['id']) + ', ' + (Sql $u['correo']) + ', ' + (Sql $u['password_hash']) + ', ' + (Sql $u['nombre']) + ', ' + (Sql (Opc $u 'biografia')) + ', ' + (Sql $u['rol']) + ', ' + (Sql $u['creado_en']) + ')'
}) -join ",`n") + ';')
$sql.Add('')
$sql.Add('-- Referencia local de cada obra (libros, peliculas y borradores). El promedio queda en NULL y 0 resenas hasta que el trigger lo calcule.')
$sql.Add('INSERT INTO obra_resumen (obra_id, tipo) VALUES')
$sql.Add((@(@(foreach ($l in $libros) { '    (' + (Sql $l['id']) + ", 'libro')" }) + @(foreach ($p in $peliculas) { '    (' + (Sql $p['id']) + ", 'pelicula')" })) -join ",`n") + ';')
$sql.Add('')
$sql.Add('-- Estados de lectura (RF-13: cada resena de abajo tiene aqui su estado "terminada").')
$sql.Add('INSERT INTO estado_obra (usuario_id, obra_id, estado, actualizado_en) VALUES')
$sql.Add((@(foreach ($e in $estados) { '    (' + (Sql $e['usuario']) + ', ' + (Sql $e['obra']) + ', ' + (Sql $e['estado']) + ', ' + (Sql $e['actualizado_en']) + ')' }) -join ",`n") + ';')
$sql.Add('')
$sql.Add('-- Resenas: cada INSERT dispara trg_resena_promedio, que recalcula promedio y total_resenas de la obra (no cuenta las ocultas).')
$sql.Add('INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, texto, oculta, creado_en, actualizado_en) VALUES')
$sql.Add((@(foreach ($r in $resenas) {
    '    (' + (Sql $r['id']) + ', ' + (Sql $r['usuario']) + ', ' + (Sql $r['obra']) + ', ' + (Sql $r['calificacion']) + ', ' + (Sql (Opc $r 'texto')) + ', ' + (Sql $r['oculta']) + ', ' + (Sql $r['creado_en']) + ', ' + (Sql $r['creado_en']) + ')'
}) -join ",`n") + ';')
$sql.Add('')
$sql.Add('INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES')
$sql.Add((@(foreach ($s in $seguimientos) { '    (' + (Sql $s['seguidor']) + ', ' + (Sql $s['seguido']) + ')' }) -join ",`n") + ';')
$sql.Add('')
$sql.Add('INSERT INTO lista (lista_id, usuario_id, nombre) VALUES')
$sql.Add((@(foreach ($l in $listas) { '    (' + (Sql $l['id']) + ', ' + (Sql $l['usuario']) + ', ' + (Sql $l['nombre']) + ')' }) -join ",`n") + ';')
$sql.Add('')
$sql.Add('INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES')
$sql.Add((@(foreach ($l in $listas) { $pos = 0; foreach ($o in @($l['obras'])) { $pos++; '    (' + (Sql $l['id']) + ', ' + (Sql $o) + ', ' + $pos + ')' } }) -join ",`n") + ';')
$sql.Add('')
$sql.Add('COMMIT;')
$sql.Add('')
$sql.Add('-- Resumen de lo cargado')
$sql.Add("SELECT 'usuario' AS tabla, count(*) AS filas FROM usuario UNION ALL SELECT 'obra_resumen', count(*) FROM obra_resumen UNION ALL")
$sql.Add("       SELECT 'resena', count(*) FROM resena UNION ALL SELECT 'estado_obra', count(*) FROM estado_obra UNION ALL")
$sql.Add("       SELECT 'seguimiento', count(*) FROM seguimiento UNION ALL SELECT 'lista', count(*) FROM lista UNION ALL SELECT 'elemento_lista', count(*) FROM elemento_lista;")
$textoSql = ($sql -join "`n") + "`n"

# =============================================================== documental
$js = New-Object System.Collections.Generic.List[string]
$js.Add('// =============================================================================')
foreach ($c in $cabecera) { $js.Add('// ' + $c) }
$js.Add('// Se puede repetir: vacia las tres colecciones y vuelve a cargar. Requiere 01-colecciones.js y 02-indices.js.')
$js.Add('// El reparto de cada pelicula es la copia de las relaciones actuo_en del grafo (D-12, D-27).')
$js.Add('// =============================================================================')
$js.Add('')
$js.Add('db.libros.deleteMany({});')
$js.Add('db.peliculas.deleteMany({});')
$js.Add('db.resenas_comparativas.deleteMany({});')
$js.Add('')
$docsLibros = @(foreach ($l in $libros) {
    $doc = [ordered]@{ _id = $l['id']; titulo = $l['titulo']; sinopsis = $l['sinopsis'] }
    $pu = Opc $l 'portada_url'; if ($pu) { $doc['portada_url'] = $pu }
    $doc['generos'] = @($l['generos']); $doc['anio_publicacion_original'] = $l['anio_publicacion_original']
    $doc['ediciones'] = @(foreach ($e in @($l['ediciones'])) {
        $ed = [ordered]@{ edicion_id = $e['edicion_id'] }
        $i = Opc $e 'isbn'; if ($i) { $ed['isbn'] = $i }
        $ed['paginas'] = $e['paginas']; $ed['editorial'] = $e['editorial']; $ed['idioma'] = $e['idioma']; $ed['anio'] = $e['anio']
        $ed
    })
    $doc['estado_publicacion'] = $l['estado_publicacion']; $doc['creado_en'] = Fch $l['creado_en']; $doc['actualizado_en'] = Fch $l['actualizado_en']
    $doc
})
$js.Add('db.libros.insertMany(' + (Js $docsLibros 0) + ');')
$js.Add('')
$docsPeliculas = @(foreach ($p in $peliculas) {
    $doc = [ordered]@{ _id = $p['id']; titulo = $p['titulo']; sinopsis = $p['sinopsis'] }
    $pu = Opc $p 'portada_url'; if ($pu) { $doc['portada_url'] = $pu }
    $doc['generos'] = @($p['generos']); $doc['anio_estreno'] = $p['anio_estreno']; $doc['duracion_min'] = $p['duracion_min']
    $doc['plataformas'] = @(foreach ($n in @($p['plataformas'])) { [ordered]@{ nombre = $n } })
    $dt = $p['datos_tecnicos']
    $tec = [ordered]@{ idioma_original = $dt['idioma_original']; paises = @($dt['paises']) }
    if ($dt.ContainsKey('productoras')) { $tec['productoras'] = @($dt['productoras']) }
    if ($dt.ContainsKey('clasificacion')) { $tec['clasificacion'] = $dt['clasificacion'] }
    $doc['datos_tecnicos'] = $tec
    $doc['reparto'] = @(RepartoDe $p['id'])
    $doc['estado_publicacion'] = $p['estado_publicacion']; $doc['creado_en'] = Fch $p['creado_en']; $doc['actualizado_en'] = Fch $p['actualizado_en']
    $doc
})
$js.Add('db.peliculas.insertMany(' + (Js $docsPeliculas 0) + ');')
$js.Add('')
$docsComp = @(foreach ($c in $comparativas) {
    $ver = [ordered]@{ preferencia = $c['preferencia'] }
    $cm = Opc $c 'comentario'; if ($cm) { $ver['comentario'] = $cm }
    $asp = @(foreach ($a in @($c['aspectos'])) {
        $x = [ordered]@{ nombre = $a['nombre'] }
        if ($a.ContainsKey('puntuacion')) { $x['puntuacion'] = $a['puntuacion'] }
        if ($a.ContainsKey('comentario')) { $x['comentario'] = $a['comentario'] }
        $x
    })
    [ordered]@{ _id = $c['id']; usuario_id = $c['usuario']; libro_id = $c['libro']; pelicula_id = $c['pelicula']; veredicto = $ver; aspectos = $asp; oculta = $c['oculta']; creado_en = (Fch $c['creado_en']); actualizado_en = (Fch $c['creado_en']) }
})
$js.Add('db.resenas_comparativas.insertMany(' + (Js $docsComp 0) + ');')
$js.Add('')
$js.Add('print("Semilla cargada en la base ''" + db.getName() + "'': " + db.libros.countDocuments() + " libros, " + db.peliculas.countDocuments() +')
$js.Add('      " peliculas, " + db.resenas_comparativas.countDocuments() + " comparativas.");')
$textoJs = ($js -join "`n") + "`n"

# ==================================================================== grafo
$cy = New-Object System.Collections.Generic.List[string]
$cy.Add('// =============================================================================')
foreach ($c in $cabecera) { $cy.Add('// ' + $c) }
$cy.Add('// Se puede repetir: borra el grafo entero y lo vuelve a crear. Requiere 01-restricciones.cypher.')
$cy.Add('// Ejecutar con cypher-shell (grafo/cypher.sh): un archivo, un proceso.')
$cy.Add('// leyo se deriva de los estados "terminada" de LIBROS (D-16); las peliculas terminadas no crean relacion.')
$cy.Add('// Las etiquetas y relaciones llevan su nombre con tilde, como en los documentos de diseno.')
$cy.Add('// =============================================================================')
$cy.Add('')
$cy.Add('MATCH (n) DETACH DELETE n;')
$cy.Add('')
function CyLista($filas) { return '[' + "`n" + ((@($filas | ForEach-Object { '  ' + $_ })) -join ",`n") + "`n" + ']' }
$cy.Add('// ---- Nodos ----')
$cy.Add('UNWIND ' + (CyLista @(foreach ($p in $personas) {
    $m = '{persona_id: ' + (CyStr $p['id']) + ', nombre: ' + (CyStr $p['nombre'])
    $f = Opc $p 'foto_url'; if ($f) { $m += ', foto_url: ' + (CyStr $f) }
    $m + '}'
})) + ' AS fila')
$cy.Add('MERGE (p:Persona {persona_id: fila.persona_id})')
$cy.Add('SET p.nombre = fila.nombre, p.foto_url = fila.foto_url;')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($l in $libros) { CyStr $l['id'] })) + ' AS id')
$cy.Add('MERGE (:Libro {obra_id: id});')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($p in $peliculas) { CyStr $p['id'] })) + ' AS id')
$cy.Add('MERGE (:`@PEL@` {obra_id: id});')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($u in $usuarios) { CyStr $u['id'] })) + ' AS id')
$cy.Add('MERGE (:Usuario {usuario_id: id});')
$cy.Add('')
$cy.Add('// ---- Relaciones del catalogo (las crea el administrador, RF-10 y RF-11) ----')
$cy.Add('UNWIND ' + (CyLista @(foreach ($r in $escribio) { '{persona: ' + (CyStr $r['persona']) + ', libro: ' + (CyStr $r['libro']) + '}' })) + ' AS r')
$cy.Add('MATCH (p:Persona {persona_id: r.persona}), (l:Libro {obra_id: r.libro})')
$cy.Add('MERGE (p)-[:@ESC@]->(l);')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($r in $adaptado) { '{libro: ' + (CyStr $r['libro']) + ', pelicula: ' + (CyStr $r['pelicula']) + '}' })) + ' AS r')
$cy.Add('MATCH (l:Libro {obra_id: r.libro}), (f:`@PEL@` {obra_id: r.pelicula})')
$cy.Add('MERGE (l)-[:adaptado_a]->(f);')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($r in $dirigida) { '{pelicula: ' + (CyStr $r['pelicula']) + ', persona: ' + (CyStr $r['persona']) + '}' })) + ' AS r')
$cy.Add('MATCH (f:`@PEL@` {obra_id: r.pelicula}), (p:Persona {persona_id: r.persona})')
$cy.Add('MERGE (f)-[:dirigida_por]->(p);')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($r in $actuo) { '{persona: ' + (CyStr $r['persona']) + ', pelicula: ' + (CyStr $r['pelicula']) + ', personaje: ' + (CyStr $r['personaje']) + ', orden: ' + $r['orden'] + '}' })) + ' AS r')
$cy.Add('MATCH (p:Persona {persona_id: r.persona}), (f:`@PEL@` {obra_id: r.pelicula})')
$cy.Add('MERGE (p)-[a:`@ACT@`]->(f)')
$cy.Add('SET a.personaje = r.personaje, a.orden = r.orden;')
$cy.Add('')
$cy.Add('// ---- Relaciones que llegan desde el relacional (seguimiento y estado_obra) ----')
$cy.Add('UNWIND ' + (CyLista @(foreach ($s in $seguimientos) { '{seguidor: ' + (CyStr $s['seguidor']) + ', seguido: ' + (CyStr $s['seguido']) + '}' })) + ' AS r')
$cy.Add('MATCH (a:Usuario {usuario_id: r.seguidor}), (b:Usuario {usuario_id: r.seguido})')
$cy.Add('MERGE (a)-[:sigue]->(b);')
$cy.Add('')
$cy.Add('UNWIND ' + (CyLista @(foreach ($e in $leyoPares) { '{usuario: ' + (CyStr $e['usuario']) + ', libro: ' + (CyStr $e['obra']) + '}' })) + ' AS r')
$cy.Add('MATCH (u:Usuario {usuario_id: r.usuario}), (l:Libro {obra_id: r.libro})')
$cy.Add('MERGE (u)-[:@LEY@]->(l);')
$cy.Add('')
$cy.Add('// ---- Resumen de lo cargado ----')
$cy.Add('MATCH (n) RETURN head(labels(n)) AS nodos, count(*) AS total ORDER BY nodos;')
$cy.Add('MATCH ()-[r]->() RETURN type(r) AS relacion, count(*) AS total ORDER BY relacion;')
$textoCy = (($cy -join "`n") + "`n").Replace('@PEL@', 'Pel' + [char]0x00ED + 'cula').Replace('@ESC@', 'escribi' + [char]0x00F3).Replace('@ACT@', 'actu' + [char]0x00F3 + '_en').Replace('@LEY@', 'ley' + [char]0x00F3)

# ============================================================ escritura
$salidas = @(
    @{ Ruta = (Join-Path $raiz 'db\relacional\04-semilla.sql'); Texto = $textoSql },
    @{ Ruta = (Join-Path $raiz 'db\documental\03-semilla.js'); Texto = $textoJs },
    @{ Ruta = (Join-Path $raiz 'db\grafo\02-semilla.cypher'); Texto = $textoCy }
)
$desfase = 0
foreach ($s in $salidas) {
    $rel = $s.Ruta.Substring($raiz.Length + 1)
    if ($Verificar) {
        $actual = $null; if (Test-Path $s.Ruta) { $actual = [IO.File]::ReadAllText($s.Ruta, $utf8).Replace("`r`n", "`n") }
        if ($actual -ceq $s.Texto) { Write-Host "al dia     $rel" } else { Write-Host "DESFASADO  $rel (regenera con generar.ps1)" -ForegroundColor Red; $desfase++ }
    } else {
        [IO.File]::WriteAllText($s.Ruta, $s.Texto, $utf8)
        Write-Host ("escrito    {0}  ({1} lineas)" -f $rel, (($s.Texto -split "`n").Count - 1))
    }
}
Write-Host ("Fuente valida: {0} usuarios, {1} personas, {2} libros, {3} peliculas, {4} resenas, {5} estados, {6} seguimientos, {7} listas, {8} comparativas." -f `
    $usuarios.Count, $personas.Count, $libros.Count, $peliculas.Count, $resenas.Count, $estados.Count, $seguimientos.Count, $listas.Count, $comparativas.Count)
if ($desfase -gt 0) { exit 1 }
exit 0
