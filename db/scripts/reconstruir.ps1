# Reconstruye las tres bases DESDE CERO con un solo comando: borra los volumenes, levanta los contenedores, construye
# los esquemas, ejecuta todas las pruebas, carga la semilla y repite las consultas y la coherencia sobre ella.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. La salida de los motores, que si las lleva,
#  se guarda tal cual la entrega el contenedor.)
#
# Uso:   .\db\scripts\reconstruir.ps1                 pide confirmacion (borra datos)
#        .\db\scripts\reconstruir.ps1 -Forzar         sin preguntar
#        .\db\scripts\reconstruir.ps1 -Forzar -SinPruebas   solo borra, levanta, construye y carga la semilla
# Requiere Docker en marcha y un .env (Copy-Item .env.example .env). Tarda unos 4 minutos (3,4 medidos).
# Codigo de salida: 0 si todo pasa, 1 si algun paso falla.
#
# QUE BORRA: solo los volumenes del proyecto Compose "dlbp" (postgres_data, mongo_data y neo4j_data) y sus contenedores.
# No toca contenedores ni volumenes de otros proyectos, que comparten este Docker (D-36).
#
# ORDEN (importa): las pruebas de db/*/pruebas/ crean y BORRAN sus datos (probar-grafo.ps1 vacia el grafo entero), asi que
# se ejecutan con las bases recien construidas y SIN semilla; despues se carga la semilla y se prueba sobre ella (solo
# lectura). Los procesos pesados (JVM de Neo4j, cypher-shell, mongosh) se ejecutan de uno en uno, nunca en paralelo.
#
# Cada paso guarda su salida en db/evidencias/reconstruccion/NN-nombre.txt y el resumen queda en resumen.txt.

param([switch]$Forzar, [switch]$SinPruebas)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$utf8 = New-Object System.Text.UTF8Encoding($false)
$destino = Join-Path $raiz 'db\evidencias\reconstruccion'
$rel = 'db\evidencias\reconstruccion'     # ruta relativa y sin espacios: la usan las redirecciones de cmd

# ---------------------------------------------------------------- comprobaciones previas
cmd /c "docker info >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host 'Docker no responde. Abre Docker Desktop y vuelve a intentarlo.' -ForegroundColor Red; exit 1 }
if (-not (Test-Path (Join-Path $raiz '.env'))) {
    Write-Host 'Falta el archivo .env. Crealo con:  Copy-Item .env.example .env   (y cambia las claves).' -ForegroundColor Red; exit 1
}
if (-not $Forzar) {
    Write-Host 'Esto BORRA los volumenes y contenedores del proyecto dlbp (PostgreSQL, MongoDB y Neo4j) y los vuelve a crear.' -ForegroundColor Yellow
    Write-Host 'No toca otros proyectos de Docker.' -ForegroundColor Yellow
    $r = Read-Host 'Escribe SI para continuar'
    if ($r -cne 'SI') { Write-Host 'Cancelado.'; exit 1 }
}
New-Item -ItemType Directory -Force -Path $destino | Out-Null
Get-ChildItem $destino -Filter '*.txt' | Remove-Item -Force

# ---------------------------------------------------------------- ayudas
$resumen = New-Object System.Collections.Generic.List[string]
$fallas = 0
$n = 0
$inicioTotal = Get-Date
$abortar = $false

# Ejecuta un comando con cmd, guarda su salida y registra el resultado. -Continuar: si falla, sigue con el resto.
function Paso([string]$nombre, [string]$que, [string]$comando, [switch]$Continuar) {
    if ($script:abortar) { return }
    $script:n++
    $archivo = '{0}\{1:00}-{2}.txt' -f $rel, $script:n, $nombre
    Write-Host ('[{0:00}] {1} ...' -f $script:n, $que) -NoNewline
    $inicio = Get-Date
    # chcp 65001: los scripts hijos de PowerShell escriben en UTF-8 y no en la pagina OEM.
    cmd /c "chcp 65001 >nul 2>&1 & $comando > $archivo 2>&1"
    $codigo = $LASTEXITCODE
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
    if ($codigo -eq 0) { $estado = 'OK   ' } else { $estado = 'FALLA'; $script:fallas++ }
    $linea = '{0}  [{1:00}] {2,-58} {3,6} s  (codigo {4})' -f $estado, $script:n, $que, $seg, $codigo
    Write-Host ("`r" + $linea) -ForegroundColor $(if ($codigo -eq 0) { 'Green' } else { 'Red' })
    $script:resumen.Add($linea)
    if ($codigo -ne 0 -and -not $Continuar) {
        Write-Host "     Detalle en $rel\" -ForegroundColor Red
        $script:abortar = $true
    }
}
$ps = 'powershell -NoProfile -ExecutionPolicy Bypass -File'

# ---------------------------------------------------------------- 1. borrar y levantar (una base cada vez)
Paso 'borrar'           'Borrar contenedores y volumenes del proyecto'    'docker compose --profile todas --profile herramientas down -v --remove-orphans'
Paso 'levantar-postgres' 'Levantar PostgreSQL (espera a estar sano)'        'docker compose --profile postgres up -d --wait'
Paso 'levantar-mongo'    'Levantar MongoDB (espera a estar sano)'           'docker compose --profile mongo up -d --wait'
Paso 'levantar-neo4j'    'Levantar Neo4j (espera a estar sano)'             'docker compose --profile neo4j up -d --wait'

# ---------------------------------------------------------------- 2. construir los esquemas, sin datos
Paso 'construir-relacional' 'Construir esquema relacional (sin semilla)'    'docker exec -e SIN_SEMILLA=1 dlbp-postgres sh /db/relacional/construir.sh'
Paso 'construir-documental' 'Construir colecciones e indices (sin semilla)' 'docker exec -e SIN_SEMILLA=1 dlbp-mongo sh /db/documental/construir.sh'
Paso 'construir-grafo'      'Construir restricciones del grafo (sin semilla)' 'docker compose --profile herramientas run --rm --no-deps -T -e SIN_SEMILLA=1 neo4j-cliente /db/grafo/construir.sh'

# ---------------------------------------------------------------- 3. pruebas (crean y borran sus datos)
if (-not $SinPruebas) {
    Paso 'probar-relacional'   'Pruebas relacionales (integridad, trigger, indices)'  "$ps .\db\scripts\probar-relacional.ps1" -Continuar
    Paso 'probar-documental'   'Pruebas documentales (validador e indices)'           "$ps .\db\scripts\probar-documental.ps1" -Continuar
    Paso 'probar-grafo'        'Pruebas del grafo (restricciones, cardinalidad)'      "$ps .\db\scripts\probar-grafo.ps1" -Continuar
    Paso 'probar-concurrencia' 'Prueba de concurrencia de D-23 (grafo)'               "$ps .\db\scripts\probar-grafo-concurrencia.ps1" -Continuar
}

# ---------------------------------------------------------------- 4. semilla y pruebas sobre ella (solo lectura)
Paso 'cargar-semilla' 'Cargar la semilla en las tres bases'                    "$ps .\db\scripts\cargar-semilla.ps1" -Continuar
if ($fallas -eq 0 -or $resumen[$resumen.Count - 1] -match '^OK') {
    Paso 'probar-semilla' 'Consultas representativas y coherencia sobre la semilla' "$ps .\db\scripts\probar-semilla.ps1" -Continuar
}

# ---------------------------------------------------------------- resumen
$segTotal = [math]::Round(((Get-Date) - $inicioTotal).TotalSeconds, 1)
$versiones = @()
try {
    $versiones += 'Docker ' + (docker info --format '{{.ServerVersion}}  (memoria que ve Docker: {{.MemTotal}} bytes)')
    $versiones += (docker exec dlbp-postgres postgres --version)
    $versiones += 'MongoDB ' + ((docker exec dlbp-mongo mongod --version | Select-Object -First 1) -replace 'db version ', '')
    $versiones += 'Neo4j ' + (docker exec dlbp-neo4j neo4j --version)
} catch { $versiones += 'No se pudieron leer las versiones: ' + $_.Exception.Message }
$memoria = @(docker stats --no-stream --format '{{.Name}}  {{.MemUsage}}  ({{.MemPerc}})' 2>$null | Where-Object { $_ -match '^dlbp-' })
$commit = ''; try { $commit = (git rev-parse --short HEAD 2>$null) } catch { }

$salida = @("Reconstruccion desde cero - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
if ($commit) { $salida += "Commit del repositorio: $commit" }
$salida += $versiones
$salida += ''
$salida += $resumen
$salida += ''
$salida += "Total: $segTotal s ($([math]::Round($segTotal / 60, 1)) min)"
$salida += ''
$salida += 'Memoria de los contenedores al terminar (docker stats):'
$salida += @($memoria | ForEach-Object { '  ' + $_ })
[IO.File]::WriteAllLines((Join-Path $destino 'resumen.txt'), [string[]]$salida, $utf8)

Write-Host ''
Write-Host (($salida | Select-Object -Skip 1) -join "`n")
if ($fallas -gt 0) { Write-Host "`n$fallas paso(s) fallaron. Detalle en $rel\" -ForegroundColor Red; exit 1 }
Write-Host "`nReconstruccion completa. Las tres bases quedan levantadas y con la semilla cargada." -ForegroundColor Green
exit 0
