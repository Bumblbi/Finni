param(
    [string]$Architectures = 'armeabi-v7a,arm64-v8a,x86,x86_64',
    [string]$JdkHome,
    [string]$SdkHome,
    [string]$NodeDirectory,
    [string]$GradleUserHome
)

$ErrorActionPreference = 'Stop'
$mobileRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$androidRoot = Join-Path $mobileRoot 'android'

if (-not $JdkHome) {
    $localJdk = @(
        Join-Path $mobileRoot '.artifacts\tooling\jdk'
        Join-Path $mobileRoot '.artifacts\jdk'
    ) | ForEach-Object {
        Get-ChildItem -LiteralPath $_ -Directory -ErrorAction SilentlyContinue
    } | Where-Object { $_.Name -like 'jdk-17*' } | Select-Object -First 1
    $JdkHome = if ($localJdk) { $localJdk.FullName } else { $env:JAVA_HOME }
}
if (-not $SdkHome) {
    $localSdk = @(
        Join-Path $mobileRoot '.artifacts\tooling\android-sdk'
        Join-Path $mobileRoot '.artifacts\android-sdk'
    ) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'platforms\android-36') } | Select-Object -First 1
    $SdkHome = if ($localSdk) { $localSdk } else { $env:ANDROID_HOME }
}
if (-not $NodeDirectory) {
    $localNode = @(
        Join-Path $mobileRoot '.artifacts\tooling\node'
        Join-Path $mobileRoot '.artifacts\node'
    ) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'node.exe') } | Select-Object -First 1
    if ($localNode) { $NodeDirectory = $localNode }
}
if (-not $JdkHome -or -not (Test-Path -LiteralPath (Join-Path $JdkHome 'bin\java.exe'))) { throw 'JDK 17 not found. Pass -JdkHome.' }
if (-not $SdkHome -or -not (Test-Path -LiteralPath (Join-Path $SdkHome 'platforms\android-36'))) { throw 'Android SDK 36 not found. Pass -SdkHome.' }
if (-not (Test-Path -LiteralPath (Join-Path $mobileRoot '.secrets\finni-release.p12'))) { throw 'Release keystore not found in mobile/.secrets.' }
if (-not (Test-Path -LiteralPath (Join-Path $mobileRoot '.secrets\release.properties'))) { throw 'Release signing properties not found in mobile/.secrets.' }
if (-not (Test-Path -LiteralPath (Join-Path $mobileRoot 'node_modules\expo'))) { throw 'Dependencies missing. Run npm ci in mobile.' }

$env:JAVA_HOME = (Resolve-Path -LiteralPath $JdkHome).Path
$env:ANDROID_HOME = (Resolve-Path -LiteralPath $SdkHome).Path
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = if ($GradleUserHome) { $GradleUserHome } else { Join-Path $env:USERPROFILE '.gradle' }
$env:NODE_ENV = 'production'
if ($NodeDirectory) { $env:PATH = (Resolve-Path -LiteralPath $NodeDirectory).Path + ';' + $env:PATH }

Write-Output 'Build tools:'
& (Join-Path $env:JAVA_HOME 'bin\java.exe') -version
& node --version
Write-Output ('Android SDK: ' + $env:ANDROID_HOME)
Write-Output ('Gradle home: ' + $env:GRADLE_USER_HOME)
Write-Output ('Architectures: ' + $Architectures)

Push-Location $androidRoot
try {
    & '.\gradlew.bat' ':app:assembleRelease' "-PreactNativeArchitectures=$Architectures" '--console=plain' '--no-daemon' '--max-workers=1'
    if ($LASTEXITCODE -ne 0) { throw "Gradle release build failed (exit $LASTEXITCODE)." }
} finally { Pop-Location }

$apk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apk)) { throw 'Gradle finished without app-release.apk.' }
$verify = Join-Path $env:ANDROID_HOME 'build-tools\36.0.0\apksigner.bat'
if (-not (Test-Path -LiteralPath $verify)) { throw 'Android apksigner 36.0.0 not found.' }
& $verify verify --verbose --print-certs $apk
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
Get-Item -LiteralPath $apk | Select-Object FullName,Length
Get-FileHash -LiteralPath $apk -Algorithm SHA256 | Select-Object Algorithm,Hash
