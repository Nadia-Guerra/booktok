# Carga la semilla en las tres bases (ya construidas) y guarda la salida en db/evidencias/semilla/carga.txt.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. La salida de los motores, que si las
#  lleva, se guarda tal cual la entrega el contenedor.)
#
# Uso:   .\db\scripts\cargar-semilla.ps1
# Requiere los tres contenedores levantados y el esquema construido (construir.sh de cada base).
# Cada cargador vacia su base antes de cargar, asi que se puede repetir. Se ejecutan en secuencia, nunca a la vez:
# el cliente de Neo4j es una JVM y la maquina tiene poca memoria (D-36).
# Antes de cargar comprueba que los tres archivos generados corresponden a semilla.json.
# Codigo de salida: 0 si todo carga, 1 si algo falla.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$destino = Join-Path $raiz 'db\evidencias\semilla'
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$archivo = Join-Path $destino 'carga.txt'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($archivo, "Carga de la semilla - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n`r`n", $utf8)

# 1. Los archivos generados deben estar al dia
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'db\semilla\generar.ps1') -Verificar
if ($LASTEXITCODE -ne 0) { Write-Host 'Los cargadores no corresponden a semilla.json: ejecuta db\semilla\generar.ps1' -ForegroundColor Red; exit 1 }

$pasos = @(
    @{ Nombre = 'relacional'; Que = 'PostgreSQL: 04-semilla.sql'
       Comando = 'docker exec dlbp-postgres sh -c "psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 -f /db/relacional/04-semilla.sql"' },
    @{ Nombre = 'documental'; Que = 'MongoDB: 03-semilla.js'
       Comando = 'docker exec dlbp-mongo sh /db/documental/mongo.sh 03-semilla.js' },
    @{ Nombre = 'grafo'; Que = 'Neo4j: 02-semilla.cypher (cliente efimero)'
       Comando = 'docker compose --profile herramientas run --rm --no-deps -T neo4j-cliente /db/grafo/cypher.sh 02-semilla.cypher' }
)

$fallas = 0
$total = Get-Date
foreach ($p in $pasos) {
    $inicio = Get-Date
    [IO.File]::AppendAllText($archivo, "=== $($p.Nombre): $($p.Que)`r`n", $utf8)
    # cmd /c para que la redireccion guarde los bytes UTF-8 del contenedor sin convertirlos.
    cmd /c "$($p.Comando) >> `"$archivo`" 2>&1"
    $codigo = $LASTEXITCODE
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    if ($codigo -eq 0) { $estado = 'CARGADO' } else { $estado = 'FALLA  '; $fallas++ }
    $linea = '{0}  {1,-11} {2}  ({3} s, codigo {4})' -f $estado, $p.Nombre, $p.Que, $seg, $codigo
    Write-Host $linea
    [IO.File]::AppendAllText($archivo, "-> $linea`r`n`r`n", $utf8)
}
$segTotal = [math]::Round(((Get-Date) - $total).TotalSeconds, 1)
[IO.File]::AppendAllText($archivo, "Total: $segTotal s`r`n", $utf8)
Write-Host "Total: $segTotal s. Salida completa en $archivo"
if ($fallas -gt 0) { Write-Host "$fallas carga(s) fallaron." -ForegroundColor Red; exit 1 }
exit 0
