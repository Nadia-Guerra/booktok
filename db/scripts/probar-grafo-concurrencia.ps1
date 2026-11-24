# Prueba de concurrencia de D-23: dos administradores registran a la vez un libro de origen distinto para la
# MISMA pelicula (RN-07: una pelicula, un solo libro). Sin bloqueo, ambas comprobaciones pasan y la pelicula
# queda con dos libros. Con el bloqueo del nodo (CG-15-bloqueo -> CG-04 -> CG-15), la segunda espera y despues
# ve el libro de la primera.
# (Sin tildes a proposito: PowerShell 5.1 lee mal UTF-8 sin BOM. Las consultas se leen de db/grafo/consultas como UTF-8.)
#
# Se hace con transacciones HTTP abiertas e intercaladas desde ESTE script (sin lanzar JVM): A queda abierta mientras B intenta.
#   .\db\scripts\probar-grafo-concurrencia.ps1
# ATENCION: borra todos los nodos del grafo antes y despues. Codigo de salida: 0 si pasa, 1 si falla.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$destino = Join-Path $raiz 'db\evidencias\grafo'
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Leer-Env([string]$clave, [string]$porDefecto) {
    $m = Select-String -Path (Join-Path $raiz '.env') -Pattern ('^' + $clave + '=(.*)$')
    if ($m) { return $m.Matches[0].Groups[1].Value.Trim() }
    return $porDefecto
}
$usuario = Leer-Env 'NEO4J_USER' 'neo4j'
$clave = Leer-Env 'NEO4J_PASSWORD' ''
$puerto = Leer-Env 'NEO4J_HTTP_HOST_PORT' '7474'
$base = "http://127.0.0.1:$puerto"

$http = New-Object System.Net.Http.HttpClient
$http.Timeout = [TimeSpan]::FromSeconds(60)
$http.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Basic', [Convert]::ToBase64String($utf8.GetBytes("${usuario}:${clave}")))
$http.DefaultRequestHeaders.Accept.Add((New-Object System.Net.Http.Headers.MediaTypeWithQualityHeaderValue('application/json')))

function Consulta([string]$archivo) {
    $lineas = [IO.File]::ReadAllLines((Join-Path $raiz ('db\grafo\consultas\' + $archivo)), $utf8) | Where-Object { $_ -notmatch '^\s*//' }
    return (($lineas -join "`n").Trim() -replace ';\s*$', '')
}
function Sentencia([string]$texto, [string]$parametrosJson) {
    return '{"statement":' + (ConvertTo-Json -InputObject $texto -Compress) + ',"parameters":{' + $parametrosJson + '}}'
}
function Cuerpo([string[]]$sentencias) { return '{"statements":[' + ($sentencias -join ',') + ']}' }

# Envia sin esperar la respuesta: devuelve la tarea (para poder dejar una peticion bloqueada)
function Enviar-Async([string]$url, [string]$json) {
    $contenido = New-Object System.Net.Http.StringContent($json, $utf8, 'application/json')
    return $http.PostAsync($url, $contenido)
}
function Resultado([System.Threading.Tasks.Task]$tarea) {
    $resp = $tarea.Result
    $bytes = $resp.Content.ReadAsByteArrayAsync().Result
    return ($utf8.GetString($bytes) | ConvertFrom-Json)
}
function Enviar([string]$url, [string]$json) { return Resultado (Enviar-Async $url $json) }
function Filas($respuesta, [int]$indice) { return @($respuesta.results[$indice].data).Count }

# Transacciones abiertas: begin devuelve la URL de la transaccion y la de commit
function Abrir-Tx([string]$json) {
    $r = Enviar "$base/db/neo4j/tx" $json
    if ($r.errors -and $r.errors.Count -gt 0) { throw ('Error al abrir transaccion: ' + $r.errors[0].message) }
    $ruta = ([Uri]$r.commit).AbsolutePath
    return @{ Respuesta = $r; Tx = "$base" + ($ruta -replace '/commit$', ''); Commit = "$base$ruta" }
}
function Confirmar($tx) { return Enviar $tx.Commit '{"statements":[]}' }
function Revertir($tx) { $null = $http.DeleteAsync($tx.Tx).Result }

function Limpiar() { $null = Enviar "$base/db/neo4j/tx/commit" (Cuerpo @((Sentencia 'MATCH (n) DETACH DELETE n' ''))) }
function Preparar() {
    Limpiar
    $r = Enviar "$base/db/neo4j/tx/commit" (Cuerpo @(
        (Sentencia (Consulta 'CG-11-pelicula.cypher') '"obra_id":"F1"'),
        (Sentencia (Consulta 'CG-11-libro.cypher') '"obra_id":"L1"'),
        (Sentencia (Consulta 'CG-11-libro.cypher') '"obra_id":"L2"')))
    if ($r.errors -and $r.errors.Count -gt 0) { throw ('Error al preparar: ' + $r.errors[0].message) }
}
function Libros-De-Origen() {
    $r = Enviar "$base/db/neo4j/tx/commit" (Cuerpo @((Sentencia (Consulta 'CG-04.cypher') '"pelicula_id":"F1"')))
    return (@($r.results[0].data | ForEach-Object { $_.row[0] }) | Sort-Object) -join ','
}

$salida = New-Object System.Collections.Generic.List[string]
$fallas = 0
function Informar([string]$estado, [string]$id, [string]$texto) {
    $script:salida.Add(('{0,-6} {1,-8} {2}' -f $estado, $id, $texto))
    if ($estado -eq 'FALLA') { $script:fallas++ }
}
$salida.Add("Prueba de concurrencia de D-23 ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))")
$salida.Add('')

$pF = '"pelicula_id":"F1"'
$pL1 = '"libro_id":"L1","pelicula_id":"F1"'
$pL2 = '"libro_id":"L2","pelicula_id":"F1"'

# ------------------------------------------------------------------ D-23-a: con bloqueo
Preparar
# A: bloquea, comprueba (no hay libro) y crea la adaptacion con L1, SIN confirmar todavia
$a = Abrir-Tx (Cuerpo @((Sentencia (Consulta 'CG-15-bloqueo.cypher') $pF),
                        (Sentencia (Consulta 'CG-04.cypher') $pF),
                        (Sentencia (Consulta 'CG-15.cypher') $pL1)))
$aComprobacion = Filas $a.Respuesta 1
Informar $(if ($aComprobacion -eq 0) { 'PASA' } else { 'FALLA' }) 'D23-a1' "A: con el nodo bloqueado, CG-04 no ve ningun libro de origen ($aComprobacion filas) y crea la adaptacion con L1 (sin confirmar)"

# B: intenta bloquear el mismo nodo mientras A sigue abierta: debe QUEDAR ESPERANDO
$tareaB = Enviar-Async "$base/db/neo4j/tx" (Cuerpo @((Sentencia (Consulta 'CG-15-bloqueo.cypher') $pF)))
Start-Sleep -Seconds 3
Informar $(if (-not $tareaB.IsCompleted) { 'PASA' } else { 'FALLA' }) 'D23-a2' "B: tras 3 s su bloqueo sigue esperando a que A confirme (peticion completada: $($tareaB.IsCompleted))"

# A confirma; B se libera
$null = Confirmar $a
$liberada = $tareaB.Wait(20000)
Informar $(if ($liberada) { 'PASA' } else { 'FALLA' }) 'D23-a3' 'B: al confirmar A, su bloqueo se libera'
if ($liberada) {
    $rB = Resultado $tareaB
    $b = @{ Tx = "$base" + (([Uri]$rB.commit).AbsolutePath -replace '/commit$', ''); Commit = "$base" + ([Uri]$rB.commit).AbsolutePath }
    # B comprueba con CG-04 DESPUES de bloquear: ya ve el libro de A
    $rc = Enviar $b.Tx (Cuerpo @((Sentencia (Consulta 'CG-04.cypher') $pF)))
    $bVe = Filas $rc 0
    Informar $(if ($bVe -eq 1) { 'PASA' } else { 'FALLA' }) 'D23-a4' "B: su CG-04 ya ve el libro de A ($bVe fila): la API rechazaria y NO llamaria a CG-15"
    Revertir $b
}
$origen = Libros-De-Origen
Informar $(if ($origen -eq 'L1') { 'PASA' } else { 'FALLA' }) 'D23-a5' "Resultado con bloqueo: la pelicula tiene exactamente un libro de origen ($origen)"

# ---------------------------------------------------- D-23-b: control SIN bloqueo (informativo)
Preparar
$a = Abrir-Tx (Cuerpo @((Sentencia (Consulta 'CG-04.cypher') $pF), (Sentencia (Consulta 'CG-15.cypher') $pL1)))
$b = Abrir-Tx (Cuerpo @((Sentencia (Consulta 'CG-04.cypher') $pF)))      # B comprueba: A no ha confirmado, no ve nada
$bVe = Filas $b.Respuesta 0
$tareaB2 = Enviar-Async $b.Tx (Cuerpo @((Sentencia (Consulta 'CG-15.cypher') $pL2)))   # B crea tambien (puede esperar el candado)
Start-Sleep -Seconds 2
$null = Confirmar $a
$null = $tareaB2.Wait(20000)
$null = Confirmar $b
$origen = Libros-De-Origen
if ($origen -eq 'L1,L2') {
    Informar 'INFO' 'D23-b' "Control SIN bloqueo: las dos comprobaciones pasaron (B vio $bVe filas) y la pelicula quedo con DOS libros de origen ($origen): lo que D-23 evita"
} else {
    Informar 'INFO' 'D23-b' "Control SIN bloqueo: esta vez no se reprodujo la violacion de RN-07 (libros: $origen)"
}

Limpiar
$salida.Add('')
if ($fallas -eq 0) { $salida.Add('Prueba D-23: PASA') } else { $salida.Add("Prueba D-23: FALLA ($fallas comprobaciones)") }
[IO.File]::WriteAllLines((Join-Path $destino '04-concurrencia-d23.txt'), [string[]]$salida, $utf8)
foreach ($l in $salida) { Write-Host $l }
if ($fallas -gt 0) { exit 1 }
exit 0
