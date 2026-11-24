# Ejecuta las pruebas del grafo (db/grafo/pruebas/*.cypher) contra Neo4j y guarda la salida en db/evidencias/grafo/.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los archivos de pruebas, que si las
#  llevan, se leen y se envian explicitamente como UTF-8.)
#
# Uso:   .\db\scripts\probar-grafo.ps1                 todas las pruebas
#        .\db\scripts\probar-grafo.ps1 01-restricciones.cypher
# Requiere Neo4j levantado y construido (docker compose run --rm --no-deps -T neo4j-cliente /db/grafo/construir.sh).
# ATENCION: cada prueba BORRA todos los nodos del grafo (MATCH (n) DETACH DELETE n) antes de empezar y al terminar.
# Se conecta por la API HTTP de Neo4j (puerto NEO4J_HTTP_HOST_PORT de .env), sin lanzar ninguna JVM.
# Codigo de salida: 0 si todo pasa, 1 si algo falla.
#
# Formato de un archivo de pruebas (ver db/grafo/pruebas/):
#   // @prueba ID | descripcion          empieza una prueba (limpia el grafo)
#   // @paso descripcion                 (opcional) describe el paso que termina en el siguiente @espera
#   // @param nombre = <JSON>            parametro para las sentencias del paso (se limpia tras cada @espera)
#   // @incluir CG-22.cypher             inserta una consulta de db/grafo/consultas/ (sin ; final)
#   <sentencias terminadas en ;>
#   // @espera ok | error <codigo> | valor <texto> | filas <n> | plan <operador>
# La expectativa va DESPUES de las sentencias y las evalua juntas, en una sola transaccion, sobre la ULTIMA.
# Atajos de id: @P1 = persona 1, @L1 = libro 1, @F1 = pelicula 1, @U1 = usuario 1 (UUID reproducible).

param([string[]]$Archivos)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dirGrafo = Join-Path $raiz 'db\grafo'
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
$uri = "http://127.0.0.1:$puerto/db/neo4j/tx/commit"
$cabeceras = @{ Authorization = 'Basic ' + [Convert]::ToBase64String($utf8.GetBytes("${usuario}:${clave}")); Accept = 'application/json;charset=UTF-8' }

# Envia las sentencias en una sola transaccion. Devuelve el objeto de la respuesta de Neo4j.
function Invoke-Cypher([string[]]$sentencias, [string]$parametrosJson) {
    $items = foreach ($s in $sentencias) {
        '{"statement":' + (ConvertTo-Json -InputObject $s -Compress) + ',"parameters":{' + $parametrosJson + '}}'
    }
    $cuerpo = '{"statements":[' + ($items -join ',') + ']}'
    try {
        $r = Invoke-WebRequest -Uri $uri -Method Post -Body $utf8.GetBytes($cuerpo) -ContentType 'application/json; charset=utf-8' `
             -Headers $cabeceras -UseBasicParsing
        $texto = $utf8.GetString($r.RawContentStream.ToArray())
        return ($texto | ConvertFrom-Json)
    } catch {
        throw "No se pudo hablar con Neo4j en $uri : $($_.Exception.Message)"
    }
}

function Expandir([string]$texto) {
    $codigos = @{ P = 1; L = 2; F = 3; U = 4 }
    return [regex]::Replace($texto, '@([PLFU])(\d+)', {
        param($m)
        '00000000-0000-4000-8000-' + $codigos[$m.Groups[1].Value] + ([int]$m.Groups[2].Value).ToString('00000000000')
    })
}

function Texto-De([object]$v) {
    if ($null -eq $v) { return '(nulo)' }
    if ($v -is [bool]) { return $v.ToString().ToLower() }
    return [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0}', $v)
}

if ($Archivos) { $lista = $Archivos | ForEach-Object { Join-Path $dirGrafo ('pruebas\' + $_) } }
else { $lista = Get-ChildItem (Join-Path $dirGrafo 'pruebas') -Filter '*.cypher' | Sort-Object Name | ForEach-Object { $_.FullName } }

$totalFallas = 0
$totalPasos = 0
$resumen = @()
foreach ($archivo in $lista) {
    $nombre = [IO.Path]::GetFileNameWithoutExtension($archivo)
    $salida = New-Object System.Collections.Generic.List[string]
    $salida.Add("Pruebas del grafo: $nombre  ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))")
    $salida.Add('')
    $inicio = Get-Date
    $fallas = 0; $pasos = 0
    $buffer = New-Object System.Collections.Generic.List[string]
    $parametros = New-Object System.Collections.Specialized.OrderedDictionary
    $pruebaId = ''; $pruebaDesc = ''; $pasoDesc = ''; $paso = 0

    foreach ($linea in [IO.File]::ReadAllLines($archivo, $utf8)) {
        if ($linea -match '^\s*//\s*@prueba\s+(\S+)\s*\|\s*(.+?)\s*$') {
            $pruebaId = $Matches[1]; $pruebaDesc = $Matches[2]; $paso = 0
            $buffer.Clear(); $parametros.Clear()
            Invoke-Cypher @('MATCH (n) DETACH DELETE n') '' | Out-Null
        }
        elseif ($linea -match '^\s*//\s*@paso\s+(.+?)\s*$') {
            $pasoDesc = $Matches[1]
        }
        elseif ($linea -match '^\s*//\s*@param\s+(\w+)\s*=\s*(.+?)\s*$') {
            $parametros[$Matches[1]] = Expandir $Matches[2]
        }
        elseif ($linea -match '^\s*//\s*@incluir\s+(\S+)\s*$') {
            $ruta = Join-Path $dirGrafo ('consultas\' + $Matches[1])
            $contenido = [IO.File]::ReadAllLines($ruta, $utf8) | Where-Object { $_ -notmatch '^\s*//' }
            $texto = (($contenido -join "`n").Trim()) -replace ';\s*$', ''
            $buffer.Add($texto)
        }
        elseif ($linea -match '^\s*//\s*@espera\s+(\w+)\s*(.*?)\s*$') {
            $tipo = $Matches[1]; $arg = Expandir $Matches[2]
            $paso++; $pasos++
            $sentencias = @(([string]::Join("`n", $buffer)) -split ';\s*(?:\r?\n|$)' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            $pj = (@($parametros.Keys | ForEach-Object { '"' + $_ + '":' + $parametros[$_] }) -join ',')
            $buffer.Clear(); $parametros.Clear()
            $resp = Invoke-Cypher $sentencias $pj
            $hayError = ($resp.errors -and $resp.errors.Count -gt 0)
            $ultimo = $null
            if ($resp.results -and $resp.results.Count -gt 0) { $ultimo = $resp.results[$resp.results.Count - 1] }
            $obtenido = ''; $esperado = ''; $ok = $false
            switch ($tipo) {
                'ok'    { $esperado = 'ok'; $obtenido = if ($hayError) { 'error ' + $resp.errors[0].code + ': ' + ($resp.errors[0].message -split "`n")[0] } else { 'ok' }; $ok = -not $hayError }
                'error' { $esperado = "error $arg"; $obtenido = if ($hayError) { 'error ' + $resp.errors[0].code } else { 'sin error' }; $ok = $hayError -and ($resp.errors[0].code -eq $arg) }
                'valor' {
                    $esperado = "valor $arg"
                    if ($hayError) { $obtenido = 'error ' + $resp.errors[0].code + ': ' + ($resp.errors[0].message -split "`n")[0] }
                    elseif ($ultimo -and $ultimo.data.Count -gt 0) { $obtenido = 'valor ' + (Texto-De $ultimo.data[0].row[0]); $ok = ($obtenido -ceq $esperado) }
                    else { $obtenido = 'sin filas' }
                }
                'filas' {
                    $esperado = "filas $arg"
                    if ($hayError) { $obtenido = 'error ' + $resp.errors[0].code + ': ' + ($resp.errors[0].message -split "`n")[0] }
                    else { $n = 0; if ($ultimo) { $n = @($ultimo.data).Count }; $obtenido = "filas $n"; $ok = ($obtenido -eq $esperado) }
                }
                'plan' {
                    $esperado = "plan con $arg"
                    if ($hayError) { $obtenido = 'error ' + $resp.errors[0].code }
                    elseif ($ultimo -and $ultimo.plan) { $json = ConvertTo-Json -InputObject $ultimo.plan -Depth 30 -Compress; $ok = $json.Contains($arg); $obtenido = if ($ok) { "plan con $arg" } else { 'plan sin ' + $arg } }
                    else { $obtenido = 'sin plan' }
                }
                default { throw "Expectativa desconocida '@espera $tipo' en $nombre ($pruebaId)" }
            }
            if ($ok) { $marca = 'PASA ' } else { $marca = 'FALLA'; $fallas++ }
            $etiqueta = if ($pruebaId) { "$pruebaId.$paso" } else { "?.$paso" }
            $descripcion = $pruebaDesc
            if ($pasoDesc) { $descripcion = $pruebaDesc + ' / ' + $pasoDesc }
            $pasoDesc = ''
            $salida.Add(('{0}  {1,-9} {2}' -f $marca, $etiqueta, $descripcion))
            if (-not $ok) { $salida.Add("             esperado: $esperado"); $salida.Add("             obtenido: $obtenido") }
            else { $salida.Add("             -> $obtenido") }
        }
        elseif ($linea -match '^\s*//') { }
        else { $buffer.Add((Expandir $linea)) }
    }
    Invoke-Cypher @('MATCH (n) DETACH DELETE n') '' | Out-Null

    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    $salida.Add('')
    $salida.Add("Pasan $($pasos - $fallas) de $pasos, fallan $fallas.  ($seg s)")
    [IO.File]::WriteAllLines((Join-Path $destino ($nombre + '.txt')), [string[]]$salida, $utf8)
    foreach ($l in $salida) { Write-Host $l }
    Write-Host ''
    $totalFallas += $fallas; $totalPasos += $pasos
    $resumen += ('{0}  {1,-18} {2} de {3} pasos  ({4} s)' -f $(if ($fallas -eq 0) { 'PASA ' } else { 'FALLA' }), $nombre, ($pasos - $fallas), $pasos, $seg)
}

$cabecera = @("Pruebas del grafo - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')", 'Neo4j 5.26.34 Community', '')
[IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]($cabecera + $resumen), $utf8)
Write-Host ($resumen -join "`n")
if ($totalFallas -gt 0) { Write-Host "`n$totalFallas paso(s) fallan." -ForegroundColor Red; exit 1 }
Write-Host "`nTodas las pruebas del grafo pasan ($totalPasos pasos)." -ForegroundColor Green
exit 0
