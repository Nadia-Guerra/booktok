# Ejecuta TODA la evidencia del Entregable 5 (catalogo de operaciones) y la guarda en db/evidencias/catalogo/:
#   relacional.txt   los 22 casos de PostgreSQL (db/relacional/pruebas/07-catalogo.sql, una transaccion que termina en ROLLBACK)
#   documental.txt   los 30 patrones de MongoDB (db/documental/pruebas/05-catalogo.js; escribe solo en la base aparte dlbp_pruebas)
#   grafo.txt        las 24 consultas de Neo4j (db/scripts/catalogo-grafo.ps1; cada caso en una transaccion que se revierte)
#   integradas.txt   las 5 operaciones integradas (db/scripts/catalogo-integradas.ps1; crea y borra sus propios datos)
#   resumen.txt      tiempos, cuentas y memoria
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM.)
#
# Uso:   .\db\scripts\catalogo.ps1                 todo
#        .\db\scripts\catalogo.ps1 -SinIntegradas  solo las tres bases por separado (las integradas tardan unos 3 minutos)
# Requiere las tres bases levantadas y la semilla cargada. NO borra la semilla: al final comprueba con coherencia.ps1.
# Un proceso pesado a la vez (memoria, D-36). Codigo de salida: 0 si todo pasa, 1 si algo falla.

param([switch]$SinIntegradas)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$destino = Join-Path $raiz 'db\evidencias\catalogo'
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
$resumen = New-Object System.Collections.Generic.List[string]
$resumen.Add("Evidencia del catalogo (Entregable 5) - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$resumen.Add('')
$fallas = 0
$inicioTotal = Get-Date

function Paso([string]$nombre, [string]$que, [scriptblock]$ejecutar, [scriptblock]$cuentas) {
    $inicio = Get-Date
    & $ejecutar
    $codigo = $LASTEXITCODE
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    $detalle = & $cuentas
    $estado = if ($codigo -eq 0) { 'PASA ' } else { 'FALLA' }
    if ($codigo -ne 0) { $script:fallas++ }
    $linea = '{0}  {1,-12} {2}  [{3}]  ({4} s, codigo {5})' -f $estado, $nombre, $que, $detalle, $seg, $codigo
    Write-Host $linea
    $script:resumen.Add($linea)
}
function Ultima([string]$archivo, [string]$patron) {
    return ([IO.File]::ReadAllLines((Join-Path $destino $archivo), $utf8) | Where-Object { $_ -match $patron } | Select-Object -Last 1)
}

Paso 'relacional' 'PostgreSQL: 22 operaciones (O1 a O5, O7 a O23)' {
    cmd /c "docker exec dlbp-postgres sh /db/relacional/pruebas/psql.sh 07-catalogo.sql > `"$destino\relacional.txt`" 2>&1"
} { $l = Ultima 'relacional.txt' '^\s+\d+ \|\s+\d+ \|\s+\d+\s*$'; ($l -replace '\s+', ' ').Trim() + ' (pasan | fallan | total)' }

Paso 'documental' 'MongoDB: 30 patrones de acceso' {
    cmd /c "docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/05-catalogo.js > `"$destino\documental.txt`" 2>&1"
} { Ultima 'documental.txt' '^Pasan \d+ de \d+' }

Paso 'grafo' 'Neo4j: 24 consultas' {
    powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'catalogo-grafo.ps1') | Out-Null
} { (Ultima 'grafo.txt' '^Pasan \d+ de \d+ pasos') -replace '\s+\(\d+(\.\d+)? s\)', '' }

if (-not $SinIntegradas) {
    Paso 'integradas' 'INT-01, INT-02, INT-04, INT-06, INT-07' {
        powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'catalogo-integradas.ps1') | Out-Null
    } { (Ultima 'integradas.txt' '^Casos integrados: \d+ de \d+') }
}

Paso 'coherencia' 'La semilla quedo intacta (13 comprobaciones entre las tres bases)' {
    cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\coherencia.ps1`" > `"$destino\coherencia-final.txt`" 2>&1"
} { Ultima 'coherencia-final.txt' 'comprobaciones pasan|FALLAN' }

$seg = [math]::Round(((Get-Date) - $inicioTotal).TotalSeconds, 1)
$resumen.Add('')
$resumen.Add("Total: $seg s")
$resumen.Add('')
$resumen.Add('Memoria de los contenedores (docker stats):')
foreach ($l in (docker stats --no-stream --format '  {{.Name}}  {{.MemUsage}}  ({{.MemPerc}})  CPU {{.CPUPerc}}' | Where-Object { $_ -match 'dlbp-' })) { $resumen.Add($l) }
[IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]$resumen, $utf8)
if ($fallas -gt 0) { Write-Host "`n$fallas bloque(s) con fallas. Detalle en $destino" -ForegroundColor Red; exit 1 }
Write-Host "`nToda la evidencia del catalogo pasa. Salida en $destino" -ForegroundColor Green
exit 0
