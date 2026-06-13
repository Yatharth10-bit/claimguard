param(
    [string]$EnvFile = "$PSScriptRoot\..\.env.local",
    [string]$Environments = "production,preview,development"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path $EnvFile)) {
    Write-Error "Env file not found: $EnvFile"
}

$targets = $Environments.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }

Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }

    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }

    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1)

    foreach ($envName in $targets) {
        Write-Host "Setting $name for $envName..."
        $value | npx.cmd vercel env add $name $envName --force --yes 2>&1 | Out-Host
    }
}

Write-Host "Done. Run: npx vercel deploy --prod --yes"