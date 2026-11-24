# Ejecuta las pruebas de la base relacional y guarda la salida en db/evidencias/relacional/.
# (Este archivo no lleva tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM.
#  La salida de las pruebas, que si las lleva, se guarda tal cual la entrega el contenedor.)
#
# Uso:   .\db\scripts\probar-relacional.ps1
# Requiere el contenedor dlbp-postgres levantado y el esquema construido
# (docker exec dlbp-postgres sh /db/relacional/construir.sh).
# Codigo de salida: 0 si todo pasa, 1 si algo falla.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$destino = Join-Path $raiz 'db\evidencias\relacional'
New-Item -ItemType Directory -Force -Path $destino | Out-Null

$pruebas = @(
    @{ Nombre = '01-integridad';  Que = 'Integridad: pruebas 1, 1b, 2 a 13, 16, 17 y extras'; Comando = 'sh /db/relacional/pruebas/psql.sh 01-integridad.sql' },
    @{ Nombre = '02-transaccion'; Que = 'Transaccion RF-13: prueba 14 (rollback)';              Comando = 'sh /db/relacional/pruebas/psql.sh 02-transaccion.sql' },
    @{ Nombre = '03-concurrencia';Que = 'Concurrencia del trigger: prueba 15';                  Comando = 'sh /db/relacional/pruebas/03-concurrencia.sh' },
    @{ Nombre = '04-indices';     Que = 'Indices: EXPLAIN de las consultas documentadas';      Comando = 'sh /db/relacional/pruebas/psql.sh 04-indices.sql' },
    @{ Nombre = '05-consultas';   Que = 'Consultas representativas O17, O18, O20, O22';        Comando = 'sh /db/relacional/pruebas/psql.sh 05-consultas.sql' }
)

$fallas = 0
$resumen = @()
foreach ($p in $pruebas) {
    $archivo = Join-Path $destino ($p.Nombre + '.txt')
    $inicio = Get-Date
    # cmd /c para que la redireccion guarde los bytes UTF-8 del contenedor sin convertirlos.
    cmd /c "docker exec dlbp-postgres $($p.Comando) > `"$archivo`" 2>&1"
    $codigo = $LASTEXITCODE
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    if ($codigo -eq 0) { $estado = 'PASA ' } else { $estado = 'FALLA'; $fallas++ }
    $linea = '{0}  {1,-16} {2}  ({3} s, codigo {4})' -f $estado, $p.Nombre, $p.Que, $seg, $codigo
    Write-Host $linea
    $resumen += $linea
}

$version = (docker exec dlbp-postgres postgres --version) -join ' '
$cabecera = @(
    "Pruebas relacionales - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    $version,
    ''
)
# UTF-8 sin BOM (Set-Content de PowerShell 5.1 lo anade)
[System.IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]($cabecera + $resumen), (New-Object System.Text.UTF8Encoding($false)))

if ($fallas -gt 0) { Write-Host "`n$fallas bloque(s) con fallas. Detalle en $destino" -ForegroundColor Red; exit 1 }
Write-Host "`nTodas las pruebas relacionales pasan. Evidencias en $destino" -ForegroundColor Green
exit 0
