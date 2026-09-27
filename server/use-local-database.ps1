$ErrorActionPreference = 'Stop'

function Read-PrivateValue([string] $Prompt) {
  $secureValue = Read-Host -Prompt $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$localUri = 'mongodb://127.0.0.1:27017'
$envFile = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw '.env was not found in the project folder.' }

$adminPassword = Read-PrivateValue 'Local portal admin password, at least 12 characters (input hidden)'
if ($adminPassword.Length -lt 12) {
  $adminPassword = $null
  throw 'The portal admin password must contain at least 12 characters.'
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([string[]][IO.File]::ReadAllLines($envFile))
$found = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^\s*MONGODB_URI\s*=') {
    $lines[$i] = "MONGODB_URI=$localUri"
    $found = $true
    break
  }
}
if (-not $found) { $lines.Add("MONGODB_URI=$localUri") }
[IO.File]::WriteAllLines((Resolve-Path $envFile), $lines, [Text.UTF8Encoding]::new($false))

$env:MONGODB_URI = $localUri
$env:DEFAULT_ADMIN_PASSWORD = $adminPassword
try {
  Write-Host 'Using the local MongoDB service and preparing the local admin account...'
  & npm.cmd run seed:default-admin
  if ($LASTEXITCODE -ne 0) { throw 'Local admin setup failed. Share only the error text if you need help.' }
  Write-Host 'Local database is configured. Sign in locally with username admin and the password you entered.'
} finally {
  Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
  Remove-Item Env:DEFAULT_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  $adminPassword = $null
}
