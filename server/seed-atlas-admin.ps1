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

Write-Host 'Paste the Atlas Legacy URI from Connect > Drivers.'
Write-Host 'It should start with mongodb:// and still contain the <db_password> placeholder.'
$uriTemplate = Read-Host 'Atlas URI template'
if (-not $uriTemplate.StartsWith('mongodb://')) {
  throw 'Use the Atlas Legacy URI that starts with mongodb:// (not mongodb+srv://).'
}
if (-not $uriTemplate.Contains('<db_password>')) {
  throw 'The URI must still contain the literal <db_password> placeholder.'
}

$databasePassword = Read-PrivateValue 'Atlas database user password (input hidden)'
$adminPassword = Read-PrivateValue 'New portal admin password, at least 12 characters (input hidden)'
if ($adminPassword.Length -lt 12) {
  throw 'The portal admin password must contain at least 12 characters.'
}

$escapedDatabasePassword = [Uri]::EscapeDataString($databasePassword)
$env:MONGODB_URI = $uriTemplate.Replace('<db_password>', $escapedDatabasePassword)
$env:DEFAULT_ADMIN_PASSWORD = $adminPassword

try {
  Write-Host 'Connecting to Atlas and creating/updating the portal admin...'
  & npm.cmd run seed:default-admin
  if ($LASTEXITCODE -ne 0) {
    throw 'Admin setup failed. The message above does not include your passwords; share only that error text if you need help.'
  }
} finally {
  Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
  Remove-Item Env:DEFAULT_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  $databasePassword = $null
  $adminPassword = $null
  $escapedDatabasePassword = $null
  $uriTemplate = $null
}
