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

Write-Host 'Paste the Atlas Legacy URI from Connect > Drivers, keeping <db_password> unchanged.'
$uriTemplate = Read-Host 'Atlas URI template'
if (-not $uriTemplate.StartsWith('mongodb://') -or -not $uriTemplate.Contains('<db_password>')) {
  throw 'Use the Atlas Legacy URI beginning mongodb:// with the literal <db_password> placeholder.'
}

$databasePassword = Read-PrivateValue 'Atlas database user password (input hidden)'
$escapedPassword = [Uri]::EscapeDataString($databasePassword)
$uri = $uriTemplate.Replace('<db_password>', $escapedPassword)
$envFile = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw '.env was not found in the project folder.' }

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([string[]][IO.File]::ReadAllLines($envFile))
$found = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^\s*MONGODB_URI\s*=') {
    $lines[$i] = "MONGODB_URI=$uri"
    $found = $true
    break
  }
}
if (-not $found) { $lines.Add("MONGODB_URI=$uri") }
[IO.File]::WriteAllLines((Resolve-Path $envFile), $lines, [Text.UTF8Encoding]::new($false))
$databasePassword = $null
$escapedPassword = $null
$uri = $null
$uriTemplate = $null
Write-Host 'Saved the Atlas connection URI to .env. The password was entered as hidden input.'
