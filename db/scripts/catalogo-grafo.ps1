# Ejecuta los casos del catalogo de grafo (db/grafo/pruebas/catalogo/*.cypher) sobre Neo4j CON LA SEMILLA CARGADA y guarda la
# salida en db/evidencias/catalogo/grafo.txt.
# (Sin tildes a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los archivos de casos, que si las llevan,
#  se leen y se envian explicitamente como UTF-8.)
#
# Uso:   .\db\scripts\catalogo-grafo.ps1
# A DIFERENCIA de probar-grafo.ps1, NO vacia el grafo: cada caso (@prueba) abre UNA transaccion en Neo4j, ejecuta sus pasos
# dentro de ella (cada paso ve lo que escribieron los anteriores) y la REVIERTE (ROLLBACK) al terminar. La semilla queda intacta.
# Consecuencia: un paso que provoca un error de Neo4j cierra la transaccion (Neo4j la revierte sola), asi que un caso con
# error espera ese error en su ULTIMO paso.
# Se conecta por la API HTTP de Neo4j (puerto NEO4J_HTTP_HOST_PORT de .env), sin lanzar ninguna JVM.
# Codigo de salida: 0 si todo pasa, 1 si algo falla.
#
# Formato del archivo de casos (igual que db/grafo/pruebas/):
#   // @prueba ID | descripcion          empieza un caso (cierra y revierte el anterior)
#   // @paso descripcion                 (opcional) describe el paso que termina en el siguiente @espera
#   // @param nombre = <JSON>            parametro para las sentencias del paso (se limpia tras cada @espera)
#   // @incluir CG-22.cypher             inserta una consulta de db/grafo/consultas/ (sin ; final)
#   <sentencias terminadas en ;>
#   // @espera ok | error <codigo> | valor <texto> | filas <n>
# Atajos de id: @a07 = persona 7, @b04 = libro 4, @f05 = pelicula 5, @c02 = usuario 2 (ids de la semilla);
#               @T01 = id de prueba 99000000-0000-4000-8000-000000000001 (no existe en la semilla).

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dirGrafo = Join-Path $raiz 'db\grafo'
$dirCasos = Join-Path $dirGrafo 'pruebas\catalogo'
$destino = Join-Path $raiz 'db\evidencias\catalogo'
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
$uriBase = "http://127.0.0.1:$puerto/db/neo4j/tx"
$cabeceras = @{ Authorization = 'Basic ' + [Convert]::ToBase64String($utf8.GetBytes("${usuario}:${clave}")); Accept = 'application/json;charset=UTF-8' }

$script:txUri = $null     # transaccion abierta del caso en curso

# Ejecuta las sentencias dentro de la transaccion del caso (la abre si hace falta). Devuelve la respuesta de Neo4j.
function Invoke-Cypher([string[]]$sentencias, [string]$parametrosJson) {
    $items = foreach ($s in $sentencias) {
        '{"statement":' + (ConvertTo-Json -InputObject $s -Compress) + ',"parameters":{' + $parametrosJson + '}}'
    }
    $cuerpo = '{"statements":[' + ($items -join ',') + ']}'
    $destinoUri = if ($script:txUri) { $script:txUri } else { $uriBase }
    try {
        $r = Invoke-WebRequest -Uri $destinoUri -Method Post -Body $utf8.GetBytes($cuerpo) -ContentType 'application/json; charset=utf-8' `
             -Headers $cabeceras -UseBasicParsing
        $resp = ($utf8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json)
    } catch {
        throw "No se pudo hablar con Neo4j en $destinoUri : $($_.Exception.Message)"
    }
    if ($resp.errors -and $resp.errors.Count -gt 0) { $script:txUri = $null }          # Neo4j revierte sola la transaccion con error
    elseif ($resp.commit) { $script:txUri = ($resp.commit -replace '/commit$', '') }
    return $resp
}

function Revertir-Caso {
    if ($script:txUri) {
        try { Invoke-WebRequest -Uri $script:txUri -Method Delete -Headers $cabeceras -UseBasicParsing | Out-Null } catch { }
        $script:txUri = $null
    }
}

function Expandir([string]$texto) {
    $prefijos = @{ a = 'a1'; b = 'b1'; c = 'c1'; f = 'f1'; T = '99' }
    return [regex]::Replace($texto, '@([abcfT])(\d{2})', {
        param($m)
        $prefijos[$m.Groups[1].Value] + '000000-0000-4000-8000-' + ([int]$m.Groups[2].Value).ToString('000000000000')
    })
}

function Texto-De([object]$v) {
    if ($null -eq $v) { return '(nulo)' }
    if ($v -is [bool]) { return $v.ToString().ToLower() }
    return [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0}', $v)
}

$salida = New-Object System.Collections.Generic.List[string]
$salida.Add("Catalogo del grafo sobre la semilla  ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))")
$salida.Add('Cada caso corre en una transaccion de Neo4j que se REVIERTE al terminar: la semilla no cambia.')
$salida.Add('')
$inicio = Get-Date
$pasos = 0; $fallas = 0
$casos = New-Object System.Collections.Specialized.OrderedDictionary    # id de caso -> $true si todos sus pasos pasan
$buffer = New-Object System.Collections.Generic.List[string]
$parametros = New-Object System.Collections.Specialized.OrderedDictionary
$pruebaId = ''; $pruebaDesc = ''; $pasoDesc = ''; $paso = 0

foreach ($archivo in (Get-ChildItem $dirCasos -Filter '*.cypher' | Sort-Object Name)) {
    foreach ($linea in [IO.File]::ReadAllLines($archivo.FullName, $utf8)) {
        if ($linea -match '^\s*//\s*@prueba\s+(\S+)\s*\|\s*(.+?)\s*$') {
            Revertir-Caso
            $pruebaId = $Matches[1]; $pruebaDesc = $Matches[2]; $paso = 0
            $buffer.Clear(); $parametros.Clear()
            $casos[$pruebaId] = $true
        }
        elseif ($linea -match '^\s*//\s*@paso\s+(.+?)\s*$') { $pasoDesc = $Matches[1] }
        elseif ($linea -match '^\s*//\s*@param\s+(\w+)\s*=\s*(.+?)\s*$') { $parametros[$Matches[1]] = Expandir $Matches[2] }
        elseif ($linea -match '^\s*//\s*@incluir\s+(\S+)\s*$') {
            $ruta = Join-Path $dirGrafo ('consultas\' + $Matches[1])
            $contenido = [IO.File]::ReadAllLines($ruta, $utf8) | Where-Object { $_ -notmatch '^\s*//' }
            $textoConsulta = (($contenido -join "`n").Trim()) -replace ';\s*$', ''
            $buffer.Add($textoConsulta)
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
                default { throw "Expectativa desconocida '@espera $tipo' en $($archivo.Name) ($pruebaId)" }
            }
            if ($ok) { $marca = 'PASA ' } else { $marca = 'FALLA'; $fallas++; $casos[$pruebaId] = $false }
            $descripcion = $pruebaDesc
            if ($pasoDesc) { $descripcion = $pruebaDesc + ' / ' + $pasoDesc }
            $pasoDesc = ''
            $salida.Add(('{0}  {1,-14} {2}' -f $marca, "$pruebaId.$paso", $descripcion))
            $salida.Add("               esperado: $esperado")
            $salida.Add("               obtenido: $obtenido")
        }
        elseif ($linea -match '^\s*//') { }
        else { $buffer.Add((Expandir $linea)) }
    }
}
Revertir-Caso

$seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
$total = $casos.Count
$casosOk = @($casos.Keys | Where-Object { $casos[$_] }).Count
$salida.Add('')
$salida.Add("Pasan $($pasos - $fallas) de $pasos pasos; $casosOk de $total casos pasan; fallan $fallas pasos.  ($seg s)")
$salida.Add('')
$salida.Add('Casos por consulta (normales / limite / error):')
$porCg = New-Object System.Collections.Specialized.OrderedDictionary
foreach ($k in $casos.Keys) {
    if ($k -match '^(CG-\d+)-([nle])\d+$') {
        $cg = $Matches[1]; $t = $Matches[2]
        if (-not $porCg.Contains($cg)) { $porCg[$cg] = @{ n = 0; l = 0; e = 0 } }
        $porCg[$cg][$t]++
    }
}
foreach ($cg in $porCg.Keys) { $salida.Add(('  {0}  {1} / {2} / {3}' -f $cg, $porCg[$cg].n, $porCg[$cg].l, $porCg[$cg].e)) }
[IO.File]::WriteAllLines((Join-Path $destino 'grafo.txt'), [string[]]$salida, $utf8)
foreach ($l in $salida) { Write-Host $l }
if ($fallas -gt 0) { Write-Host "`n$fallas paso(s) fallan." -ForegroundColor Red; exit 1 }
Write-Host "`nTodos los casos del grafo pasan ($pasos pasos, $total casos)." -ForegroundColor Green
exit 0
