param([string]$Keytool = 'keytool')
$ErrorActionPreference = 'Stop'
$mobileDirectory = Split-Path -Parent $PSScriptRoot
$secretDirectory = Join-Path $mobileDirectory '.secrets'
$keyFile = Join-Path $secretDirectory 'finni-release.p12'
$propertiesFile = Join-Path $secretDirectory 'release.properties'
if ((Test-Path -LiteralPath $keyFile) -or (Test-Path -LiteralPath $propertiesFile)) {
    throw 'Signing material already exists. Keep the original key for future updates.'
}
New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
$randomBytes = New-Object byte[] 32
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$generator.GetBytes($randomBytes)
$generator.Dispose()
$env:FINNI_GENERATED_PASSWORD = [Convert]::ToBase64String($randomBytes)
try {
    & $Keytool -genkeypair -keystore $keyFile -storetype PKCS12 -alias finni-release -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Finni Release' -storepass:env FINNI_GENERATED_PASSWORD -keypass:env FINNI_GENERATED_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Key generation failed.' }
    $properties = "STORE_FILE=../.secrets/finni-release.p12`nSTORE_PASSWORD=$env:FINNI_GENERATED_PASSWORD`nKEY_ALIAS=finni-release`nKEY_PASSWORD=$env:FINNI_GENERATED_PASSWORD`n"
    [IO.File]::WriteAllText($propertiesFile, $properties, [Text.Encoding]::ASCII)
    Write-Output 'Release key created in mobile/.secrets. Back up this directory securely; do not commit it.'
} finally {
    Remove-Item Env:FINNI_GENERATED_PASSWORD -ErrorAction SilentlyContinue
}
