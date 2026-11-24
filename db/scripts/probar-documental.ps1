# Ejecuta las pruebas de la base documental y guarda la salida en db/evidencias/documental/.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. La salida de las
#  pruebas, que si las lleva, se guarda tal cual la entrega el contenedor.)
#
# Uso:   .\db\scripts\probar-documental.ps1
# Requiere el contenedor dlbp-mongo levantado y la base construida
# (docker exec dlbp-mongo sh /db/documental/construir.sh).
# Las pruebas usan una base aparte (dlbp_pruebas) que borran al terminar: no tocan los datos de la aplicacion.
# Codigo de salida: 0 si todo pasa, 1 si algo falla.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$destino = Join-Path $raiz 'db\evidencias\documental'
New-Item -ItemType Directory -Force -Path $destino | Out-Null

$pruebas = @(
    @{ Nombre = '01-validacion'; Que = 'Validacion: documentos validos e invalidos (pruebas 1 a 26 y extras)' ; Archivo = 'pruebas/01-validacion.js' },
    @{ Nombre = '02-indices';    Que = 'Indices: unicidades, texto y planes explain (pruebas 1 a 9)';          Archivo = 'pruebas/02-indices.js' },
    @{ Nombre = '03-controles';  Que = 'Controles negativos: sparse, parcial y sin validador';                  Archivo = 'pruebas/03-controles.js' }
)

$fallas = 0
$resumen = @()
foreach ($p in $pruebas) {
    $archivo = Join-Path $destino ($p.Nombre + '.txt')
    $inicio = Get-Date
    # cmd /c para que la redireccion guarde los bytes UTF-8 del contenedor sin convertirlos.
    # Un solo proceso mongosh por archivo: el contenedor tiene tope de 512 MB.
    cmd /c "docker exec dlbp-mongo sh /db/documental/mongo.sh $($p.Archivo) > `"$archivo`" 2>&1"
    $codigo = $LASTEXITCODE
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    if ($codigo -eq 0) { $estado = 'PASA ' } else { $estado = 'FALLA'; $fallas++ }
    $linea = '{0}  {1,-14} {2}  ({3} s, codigo {4})' -f $estado, $p.Nombre, $p.Que, $seg, $codigo
    Write-Host $linea
    $resumen += $linea
}

$version = 'MongoDB ' + ((docker exec dlbp-mongo mongod --version | Select-Object -First 1) -replace 'db version ', '')
$cabecera = @(
    "Pruebas documentales - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    $version,
    ''
)
[System.IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]($cabecera + $resumen), (New-Object System.Text.UTF8Encoding($false)))

if ($fallas -gt 0) { Write-Host "`n$fallas bloque(s) con fallas. Detalle en $destino" -ForegroundColor Red; exit 1 }
Write-Host "`nTodas las pruebas documentales pasan. Evidencias en $destino" -ForegroundColor Green
exit 0
