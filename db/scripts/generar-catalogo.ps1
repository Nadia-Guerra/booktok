# Genera docs/entregables/entregable-5-catalogo.md a partir de:
#   docs/entregables/catalogo-operaciones.json   proposito, bases, parametros y resultado esperado de cada operacion (se escribe a mano)
#   db/evidencias/catalogo/*.txt                 casos y resultados obtenidos (los produce db/scripts/catalogo.ps1; NO se escriben a mano)
# (Este archivo lleva BOM UTF-8 a proposito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM y aqui hay textos con acentos.
#  Si lo editas, guardalo con BOM. El JSON y la evidencia se leen y se escriben como UTF-8 sin BOM.)
#
# Uso:   .\db\scripts\generar-catalogo.ps1             escribe el catalogo
#        .\db\scripts\generar-catalogo.ps1 -Verificar  no escribe: comprueba que el catalogo en disco corresponde a la fuente y a la evidencia
# Falla (codigo 1) si: una operacion no tiene casos normal, limite y de error; algun caso no PASA; hay casos en la evidencia que no pertenecen
# a ninguna operacion; o una operacion de la fuente no tiene evidencia.

param([switch]$Verificar)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$utf8 = New-Object System.Text.UTF8Encoding($false)
$fuente = Join-Path $raiz 'docs\entregables\catalogo-operaciones.json'
$salidaMd = Join-Path $raiz 'docs\entregables\entregable-5-catalogo.md'
$dirEv = Join-Path $raiz 'db\evidencias\catalogo'
$json = [IO.File]::ReadAllText($fuente, $utf8) | ConvertFrom-Json
$tx = $json.textos

# ----------------------------------------------------------------------------------------------------------- leer la evidencia
$casos = New-Object System.Collections.Specialized.OrderedDictionary     # id de caso -> objeto
function Nuevo-Caso([string]$archivo, [string]$id, [string]$desc, [string]$esperado, [string]$obtenido, [bool]$ok, [int]$pasos, [bool]$simulado) {
    if ($id -notmatch '^(.+)-([nle])(\d+)$') { throw "Identificador de caso inesperado: $id" }
    $op = $Matches[1]; $tipo = $Matches[2]; $num = [int]$Matches[3]
    $simul = $simulado -or ($desc -match '(?i)simulado')
    return [pscustomobject]@{ Id = $id; Op = $op; Tipo = $tipo; Num = $num; Desc = $desc; Esperado = $esperado; Obtenido = $obtenido; Ok = $ok; Pasos = $pasos; Simulado = $simul; Archivo = $archivo }
}

# relacional.txt: filas de la tabla de psql  caso | descripcion | esperado | obtenido | resultado
foreach ($linea in [IO.File]::ReadAllLines((Join-Path $dirEv 'relacional.txt'), $utf8)) {
    if ($linea -notmatch '^\s*(O\d+-[nle]\d+)\s+\|') { continue }
    $t = @($linea -split ' \| ' | ForEach-Object { $_.Trim() })
    $n = $t.Count
    $id = $t[0]; $res = $t[$n - 1]
    $mid = @($t[1..($n - 2)])
    $m = $mid.Count
    $desc = $null; $esp = $null; $obt = $null
    for ($k = 1; $k -lt $m; $k++) {
        $j = $k - ($m - $k)
        if ($j -lt 1) { continue }
        $o = ($mid[$k..($m - 1)] -join ' | ')
        $e = ($mid[$j..($k - 1)] -join ' | ')
        if ($o -ceq $e) { $desc = ($mid[0..($j - 1)] -join ' | '); $esp = $e; $obt = $o; break }
    }
    if ($null -eq $desc) { $desc = $mid[0]; $esp = $mid[1]; $obt = ($mid[2..($m - 1)] -join ' | ') }
    $casos[$id] = Nuevo-Caso 'relacional.txt' $id $desc $esp $obt ($res -eq 'PASA') 1 $false
}

# documental.txt: PASA  AP-01-n1  descripcion  /  esperado: ...  /  obtenido: ...
$l = [IO.File]::ReadAllLines((Join-Path $dirEv 'documental.txt'), $utf8)
for ($i = 0; $i -lt $l.Count; $i++) {
    if ($l[$i] -match '^(PASA|FALLA)\s+(AP-\d+-[nle]\d+)\s+(.*)$') {
        $esp = $l[$i + 1] -replace '^\s*esperado:\s?', ''
        $obt = $l[$i + 2] -replace '^\s*obtenido:\s?', ''
        $casos[$Matches[2]] = Nuevo-Caso 'documental.txt' $Matches[2] $Matches[3].Trim() $esp $obt ($Matches[1] -eq 'PASA') 1 $false
    }
}

# grafo.txt: un caso puede tener varios pasos (CG-01-n1.1, CG-01-n1.2...); el obtenido es el del ultimo paso
$l = [IO.File]::ReadAllLines((Join-Path $dirEv 'grafo.txt'), $utf8)
$pasosGrafo = New-Object System.Collections.Specialized.OrderedDictionary
for ($i = 0; $i -lt $l.Count; $i++) {
    if ($l[$i] -match '^(PASA|FALLA)\s+(CG-\d+-[nle]\d+)\.(\d+)\s+(.*)$') {
        $id = $Matches[2]
        $paso = [pscustomobject]@{ Ok = ($Matches[1] -eq 'PASA'); Desc = $Matches[4].Trim(); Esp = ($l[$i + 1] -replace '^\s*esperado:\s?', ''); Obt = ($l[$i + 2] -replace '^\s*obtenido:\s?', '') }
        if (-not $pasosGrafo.Contains($id)) { $pasosGrafo[$id] = New-Object System.Collections.Generic.List[object] }
        $pasosGrafo[$id].Add($paso)
    }
}
foreach ($id in $pasosGrafo.Keys) {
    $ps = $pasosGrafo[$id]
    $ok = (@($ps | Where-Object { -not $_.Ok }).Count -eq 0)
    $ultimo = $ps[$ps.Count - 1]
    $casos[$id] = Nuevo-Caso 'grafo.txt' $id $ps[0].Desc $ultimo.Esp $ultimo.Obt $ok $ps.Count $false
}

# integradas.txt: encabezado del caso, pasos [REAL]/[SIMULADO], esperado y obtenido
$l = [IO.File]::ReadAllLines((Join-Path $dirEv 'integradas.txt'), $utf8)
for ($i = 0; $i -lt $l.Count; $i++) {
    if ($l[$i] -match '^(PASA|FALLA)\s+(INT-\d+-[nle]\d+)\s+(.*?)\s+\(([\d\.]+) s\)\s*$') {
        $id = $Matches[2]; $ok = ($Matches[1] -eq 'PASA'); $desc = $Matches[3]
        $pasos = 0; $simulado = $false; $esp = ''; $obt = ''
        $j = $i + 1
        while ($j -lt $l.Count -and $l[$j] -match '^\s') {
            if ($l[$j] -match '^\s+\[(REAL|SIMULADO)\]') { $pasos++; if ($Matches[1] -eq 'SIMULADO') { $simulado = $true } }
            elseif ($l[$j] -match '^\s+esperado:\s?(.*)$') { $esp = $Matches[1] }
            elseif ($l[$j] -match '^\s+obtenido:\s?(.*)$') { $obt = $Matches[1] }
            $j++
        }
        $casos[$id] = Nuevo-Caso 'integradas.txt' $id $desc $esp $obt $ok $pasos $simulado
    }
}

$fechaEvidencia = ([IO.File]::ReadAllLines((Join-Path $dirEv 'resumen.txt'), $utf8)[0] -replace '^.* - ', '')

# ----------------------------------------------------------------------------------------------------------- comprobaciones
$errores = New-Object System.Collections.Generic.List[string]
$ids = @($json.operaciones | ForEach-Object { $_.id })
foreach ($c in $casos.Values) { if ($ids -notcontains $c.Op) { $errores.Add("El caso $($c.Id) no pertenece a ninguna operacion de la fuente") } }
function Casos-De([string]$op) { return @($casos.Values | Where-Object { $_.Op -ceq $op } | Sort-Object @{ Expression = { 'nle'.IndexOf($_.Tipo) } }, Num) }
foreach ($op in $json.operaciones) {
    $cs = Casos-De $op.id
    if ($cs.Count -eq 0) { $errores.Add("La operacion $($op.id) no tiene casos en la evidencia"); continue }
    foreach ($t in 'n', 'l', 'e') { if (@($cs | Where-Object { $_.Tipo -eq $t }).Count -eq 0) { $errores.Add("La operacion $($op.id) no tiene casos de tipo '$t'") } }
    foreach ($c in $cs) { if (-not $c.Ok) { $errores.Add("El caso $($c.Id) no pasa") } }
}
if ($errores.Count -gt 0) { $errores | ForEach-Object { Write-Host "ERROR: $_" -ForegroundColor Red }; exit 1 }

# ----------------------------------------------------------------------------------------------------------- escribir el catalogo
$md = New-Object System.Collections.Generic.List[string]
function E([string]$s) { $md.Add($s) }
function Cel([string]$s) { return ($s -replace '\|', '\|') }
$diseno = @{
    relacional = '[04-operaciones.md](../modelado/relacional/04-operaciones.md)'
    documental = '[01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md)'
    grafo      = '[01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md)'
    integrada  = '[04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md)'
}
$ejecutor = @{
    relacional = '[07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql)'
    documental = '[05-catalogo.js](../../db/documental/pruebas/05-catalogo.js)'
    grafo      = '[01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1)'
    integrada  = '[catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1)'
}
$archivoEv = @{ relacional = 'relacional.txt'; documental = 'documental.txt'; grafo = 'grafo.txt'; integrada = 'integradas.txt' }
$nombreBase = @{ relacional = 'PostgreSQL'; documental = 'MongoDB'; grafo = 'Neo4j' }
$tipoTxt = @{ n = $tx.tipos.n; l = $tx.tipos.l; e = $tx.tipos.e }
function Bases-Cortas($op) {
    if ($op.grupo -ne 'integrada') { return $nombreBase[$op.grupo] }
    $r = @(); foreach ($b in 'PostgreSQL', 'MongoDB', 'Neo4j') { if ($op.bases -match $b) { $r += $b } }
    return ($r -join ', ')
}
function Cuenta([string]$op, [string]$t) { return @($casos.Values | Where-Object { $_.Op -ceq $op -and $_.Tipo -eq $t }).Count }

E "# $($tx.titulo)"
E ''
E "_$($tx.subtitulo)_"
E ''
E "Evidencia ejecutada el $fechaEvidencia (PostgreSQL 18.7, MongoDB 9.0.4, Neo4j 5.26.34 Community)."
E ''
E $tx.generado
E ''
E '## Cómo leer este catálogo'
E ''
foreach ($p in $tx.como_leer) { E "- $p" }
E ''
E "## $($tx.seccion_resumen)"
E ''
E '| Grupo | Operaciones | Casos | Normales | Límite | Error | Resultado |'
E '|---|---|---|---|---|---|---|'
$tot = @{ ops = 0; casos = 0; n = 0; l = 0; e = 0; ok = 0 }
foreach ($g in 'relacional', 'documental', 'grafo', 'integrada') {
    $ops = @($json.operaciones | Where-Object { $_.grupo -eq $g })
    $cs = @(); foreach ($o in $ops) { $cs += Casos-De $o.id }
    $nn = @($cs | Where-Object { $_.Tipo -eq 'n' }).Count; $ll = @($cs | Where-Object { $_.Tipo -eq 'l' }).Count; $ee = @($cs | Where-Object { $_.Tipo -eq 'e' }).Count
    $okc = @($cs | Where-Object { $_.Ok }).Count
    $nom = @{ relacional = 'Relacional (PostgreSQL)'; documental = 'Documental (MongoDB)'; grafo = 'Grafo (Neo4j)'; integrada = 'Integradas (varias bases)' }[$g]
    E "| $nom | $($ops.Count) | $($cs.Count) | $nn | $ll | $ee | $okc de $($cs.Count) PASA |"
    $tot.ops += $ops.Count; $tot.casos += $cs.Count; $tot.n += $nn; $tot.l += $ll; $tot.e += $ee; $tot.ok += $okc
}
E "| **Total** | **$($tot.ops)** | **$($tot.casos)** | **$($tot.n)** | **$($tot.l)** | **$($tot.e)** | **$($tot.ok) de $($tot.casos) PASA** |"
E ''
E 'Cada operación del catálogo tiene al menos un caso normal, uno límite y uno de error, y todos pasan. El detalle por operación:'
E ''
E '| Operación | Nombre | Bases | Normales | Límite | Error | Resultado |'
E '|---|---|---|---|---|---|---|'
foreach ($op in $json.operaciones) {
    $cs = Casos-De $op.id
    $okc = @($cs | Where-Object { $_.Ok }).Count
    $sim = if (@($cs | Where-Object { $_.Simulado }).Count -gt 0) { ' (con pasos simulados)' } else { '' }
    E "| [$($op.id)](#$(($op.id).ToLower())) | $(Cel $op.titulo) | $(Bases-Cortas $op) | $(Cuenta $op.id 'n') | $(Cuenta $op.id 'l') | $(Cuenta $op.id 'e') | $okc de $($cs.Count) PASA$sim |"
}

$secciones = @(
    @{ g = 'relacional'; t = $tx.seccion_relacional },
    @{ g = 'documental'; t = $tx.seccion_documental },
    @{ g = 'grafo'; t = $tx.seccion_grafo },
    @{ g = 'integrada'; t = $tx.seccion_integradas }
)
foreach ($sec in $secciones) {
    E ''
    E "## $($sec.t)"
    foreach ($op in @($json.operaciones | Where-Object { $_.grupo -eq $sec.g })) {
        $cs = Casos-De $op.id
        $okc = @($cs | Where-Object { $_.Ok }).Count
        E ''
        E "<a id=`"$(($op.id).ToLower())`"></a>"
        E "### $($op.id). $($op.titulo)"
        E ''
        E "$($op.rf) · Actor: $($op.actor)"
        E ''
        E "**$($tx.puntos.p1).** ``$($op.id)``. $($op.proposito) Diseño: $($diseno[$op.grupo])."
        E ''
        E "**$($tx.puntos.p2).** $($op.bases)"
        E ''
        E "**$($tx.puntos.p3).** $($op.entrada)"
        if ($op.PSObject.Properties['consultas']) {
            $enl = @($op.consultas | ForEach-Object { "[$_](../../db/grafo/consultas/$_)" })
            E ''
            E "Consulta: $($enl -join ', ')."
        }
        E ''
        E "**$($tx.puntos.p4).** $($op.salida)"
        E ''
        E "**$($tx.puntos.p5).** $($cs.Count) casos: $(Cuenta $op.id 'n') normales, $(Cuenta $op.id 'l') límite y $(Cuenta $op.id 'e') de error."
        E ''
        E '| Caso | Tipo | Qué se prueba |'
        E '|---|---|---|'
        foreach ($c in $cs) { E "| ``$($c.Id)`` | $($tipoTxt[$c.Tipo]) | $(Cel $c.Desc) |" }
        E ''
        $ev = $archivoEv[$op.grupo]
        E "**$($tx.puntos.p6).** Archivo: [$ev](../../db/evidencias/catalogo/$ev). Ejecutor: $($ejecutor[$op.grupo]). Resultado: **$okc de $($cs.Count) casos PASA**."
        $sims = @($cs | Where-Object { $_.Simulado })
        if ($sims.Count -gt 0) { E ''; E "Pasos **SIMULADOS** (los haría el worker o la reconciliación, que aún no existen) en: $((($sims | ForEach-Object { '`' + $_.Id + '`' }) -join ', '))." }
        E ''
        E '| Caso | Resultado obtenido | Resultado |'
        E '|---|---|---|'
        foreach ($c in $cs) {
            $extra = ''
            if ($c.Pasos -gt 1 -and $c.Archivo -eq 'grafo.txt') { $extra = " _($($c.Pasos) pasos; se muestra el último)_" }
            $marca = if ($c.Ok) { 'PASA' } else { 'FALLA' }
            E "| ``$($c.Id)`` | ``$(Cel ($c.Obtenido -replace '`', "'"))``$extra | $marca |"
        }
        if ($op.previa) { E ''; E "Evidencia previa (Entregable 4): $($op.previa)" }
    }
}

E ''
E "## $($tx.seccion_simulado)"
E ''
foreach ($p in $tx.simulado) { E $p }
E ''
E "## $($tx.seccion_reproducir)"
E ''
foreach ($p in $tx.reproducir) { E $p; E '' }

$texto = (($md -join "`n").TrimEnd()) + "`n"
if ($Verificar) {
    $actual = if (Test-Path $salidaMd) { [IO.File]::ReadAllText($salidaMd, $utf8) } else { '' }
    if ($actual -ceq $texto) { Write-Host 'El catalogo en disco corresponde a la fuente y a la evidencia.' -ForegroundColor Green; exit 0 }
    Write-Host 'El catalogo en disco NO corresponde: ejecuta .\db\scripts\generar-catalogo.ps1' -ForegroundColor Red; exit 1
}
[IO.File]::WriteAllText($salidaMd, $texto, $utf8)
Write-Host "Catalogo escrito: $salidaMd"
Write-Host "  $($json.operaciones.Count) operaciones, $($casos.Count) casos, todos PASA."
exit 0
