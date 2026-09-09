param([switch]$CertificationAudit, [switch]$AllLocales)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$toolHome = Join-Path $root '.tmp\package-home'
$certFolder = Join-Path $toolHome 'pbiviz-certs'
$null = New-Item -ItemType Directory -Force -Path $certFolder
$pfxPath = Join-Path $certFolder 'PowerBICustomVisualTest_public.pfx'
$passPath = Join-Path $certFolder 'PowerBICustomVisualTestPass.txt'

# Tools resolves a development certificate even for package. Generate it in memory,
# never install/trust it, and isolate all tool-home writes to the ignored worktree.
$env:USERPROFILE = $toolHome
$env:HOME = $toolHome
$env:APPDATA = Join-Path $toolHome 'AppData\Roaming'
$env:LOCALAPPDATA = Join-Path $toolHome 'AppData\Local'
$password = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
$rsa = [System.Security.Cryptography.RSA]::Create(2048)
$request = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
    'CN=localhost', $rsa, [System.Security.Cryptography.HashAlgorithmName]::SHA256,
    [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$certificate = $request.CreateSelfSigned([DateTimeOffset]::Now.AddDays(-1), [DateTimeOffset]::Now.AddDays(7))
try {
    [System.IO.File]::WriteAllBytes($pfxPath, $certificate.Export(
        [System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, $password))
    [System.IO.File]::WriteAllText($passPath, $password)
    $arguments = @('.\node_modules\powerbi-visuals-tools\bin\pbiviz.js', 'package', '--no-stats')
    if ($CertificationAudit) { $arguments += '--certification-audit' }
    if ($AllLocales) { $arguments += '--all-locales' }
    & node @arguments
    $result = $LASTEXITCODE
} finally {
    $certificate.Dispose()
    $rsa.Dispose()
    if (Test-Path -LiteralPath $pfxPath) { Remove-Item -LiteralPath $pfxPath -Force }
    if (Test-Path -LiteralPath $passPath) { Remove-Item -LiteralPath $passPath -Force }
}
exit $result
