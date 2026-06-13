param(
    [string]$EnvFile = "$PSScriptRoot\..\.env.local",
    [string[]]$Targets = @("production", "preview", "development")
)

$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path $EnvFile)) {
    Write-Error "Env file not found: $EnvFile"
}

Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }

    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }

    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if ([string]::IsNullOrWhiteSpace($value)) { return }

    foreach ($envName in $Targets) {
        Write-Host "Setting $name ($envName)..."
        & npx.cmd vercel env add $name $envName --value $value --force --yes 2>&1 | Out-Host
    }
}

Write-Host "Environment variables synced to Vercel."