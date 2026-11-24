# Ejecuta sobre la SEMILLA las consultas representativas de las tres bases y la coherencia entre ellas, y guarda la
# salida en db/evidencias/semilla/. (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. La salida
# de los motores, que si las lleva, se guarda tal cual la entrega el contenedor.)
#
# Uso:   .\db\scripts\probar-semilla.ps1
# Requiere los tres contenedores levantados y la semilla cargada (db\scripts\cargar-semilla.ps1).
# SOLO LEE: no modifica ninguna base. (Las pruebas de db/*/pruebas/ sin "semilla" SI borran datos: corrigelas ANTES de
# cargar la semilla, o vuelve a cargarla despues.) Se ejecutan en secuencia, nunca a la vez (D-36).
# Codigo de salida: 0 si todo pasa, 1 si algo falla.
#
#   consultas-relacional.txt   O17, O18, O20 y O22 (db/relacional/pruebas/06-consultas-semilla.sql)
#   consultas-documental.txt   AP-01 a AP-05, AP-21 y AP-23 (db/documental/pruebas/04-consultas-semilla.js)
#   grafo-01-consultas.txt     CG-01 a CG-10 y CG-21 a CG-23 (db/grafo/pruebas/semilla/01-consultas.cypher)
#   coherencia.txt             db\scripts\coherencia.ps1
#   resumen.txt                resultado de cada bloque, tiempos y memoria

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$destino = Join-Path $raiz 'db\evidencias\semilla'
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

$resumen = New-Object System.Collections.Generic.List[string]
$fallas = 0
$total = Get-Date
function Registrar([string]$nombre, [string]$que, [int]$codigo, [double]$seg) {
    if ($codigo -eq 0) { $estado = 'PASA ' } else { $estado = 'FALLA'; $script:fallas++ }
    $linea = '{0}  {1,-12} {2}  ({3} s, codigo {4})' -f $estado, $nombre, $que, $seg, $codigo
    Write-Host $linea
    $script:resumen.Add($linea)
}

# 1 y 2: relacional y documental, un proceso por archivo dentro de su contenedor
$bloques = @(
    @{ Nombre = 'relacional'; Que = 'PostgreSQL: O17, O18, O20 y O22 sobre la semilla'; Archivo = 'consultas-relacional.txt'
       Comando = 'docker exec dlbp-postgres sh /db/relacional/pruebas/psql.sh 06-consultas-semilla.sql' },
    @{ Nombre = 'documental'; Que = 'MongoDB: AP-01 a AP-05, AP-21 y AP-23 sobre la semilla'; Archivo = 'consultas-documental.txt'
       Comando = 'docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/04-consultas-semilla.js' }
)
foreach ($b in $bloques) {
    $archivo = Join-Path $destino $b.Archivo
    $inicio = Get-Date
    # cmd /c para que la redireccion guarde los bytes UTF-8 del contenedor sin convertirlos.
    cmd /c "$($b.Comando) > `"$archivo`" 2>&1"
    Registrar $b.Nombre $b.Que $LASTEXITCODE ([math]::Round(((Get-Date) - $inicio).TotalSeconds, 1))
}

# 3: grafo (API HTTP, sin JVM), modo -Semilla: no borra nada
$inicio = Get-Date
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'db\scripts\probar-grafo.ps1') -Semilla | Out-Null
Registrar 'grafo' 'Neo4j: CG-01 a CG-10 y CG-21 a CG-23 sobre la semilla' $LASTEXITCODE ([math]::Round(((Get-Date) - $inicio).TotalSeconds, 1))

# 4: coherencia entre bases
$inicio = Get-Date
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'db\scripts\coherencia.ps1') | Out-Null
Registrar 'coherencia' 'Coherencia entre las tres bases (13 comprobaciones)' $LASTEXITCODE ([math]::Round(((Get-Date) - $inicio).TotalSeconds, 1))

# Memoria de los contenedores en este momento
$memoria = @(docker stats --no-stream --format '{{.Name}}  {{.MemUsage}}  ({{.MemPerc}})  CPU {{.CPUPerc}}' | Where-Object { $_ -match '^dlbp-' })
$segTotal = [math]::Round(((Get-Date) - $total).TotalSeconds, 1)
$cabecera = @("Consultas y coherencia sobre la semilla - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')", '')
$pie = @('', "Total: $segTotal s", '', 'Memoria de los contenedores (docker stats):') + @($memoria | ForEach-Object { '  ' + $_ })
[IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]($cabecera + $resumen + $pie), $utf8)
Write-Host ''
Write-Host (($pie | Select-Object -Skip 1) -join "`n")

if ($fallas -gt 0) { Write-Host "`n$fallas bloque(s) con fallas. Detalle en $destino" -ForegroundColor Red; exit 1 }
Write-Host "`nTodo pasa sobre la semilla. Evidencias en $destino" -ForegroundColor Green
exit 0
