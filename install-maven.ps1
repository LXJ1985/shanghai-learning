$ErrorActionPreference = "Stop"
$mvnVersion = "3.9.9"
$mvnUrl = "https://dlcdn.apache.org/maven/maven-3/$mvnVersion/binaries/apache-maven-$mvnVersion-bin.zip"
$mvnPath = "E:\AI\tools"
$zipPath = "$mvnPath\maven.zip"
$extractedDir = "$mvnPath\apache-maven-$mvnVersion"

# Clean up old attempts
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Create tools dir
New-Item -ItemType Directory -Path $mvnPath -Force | Out-Null

Write-Host "Downloading Maven $mvnVersion..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

try {
    Invoke-WebRequest -Uri $mvnUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 120
    Write-Host "Download complete. Extracting..."
    Expand-Archive -Path $zipPath -DestinationPath $mvnPath -Force
    Remove-Item $zipPath -Force
    
    # Verify
    $mvnCmd = "$extractedDir\bin\mvn.cmd"
    if (Test-Path $mvnCmd) {
        Write-Host "MAVEN_OK: $mvnCmd"
        & $mvnCmd --version
    } else {
        Write-Host "MAVEN_FAIL: mvn.cmd not found at $mvnCmd"
        Get-ChildItem $mvnPath -Recurse -Depth 2 | Select-Object FullName
    }
} catch {
    Write-Host "DOWNLOAD_ERROR: $_"
    # Try archive URL as fallback
    $archiveUrl = "https://archive.apache.org/dist/maven/maven-3/$mvnVersion/binaries/apache-maven-$mvnVersion-bin.zip"
    Write-Host "Trying archive: $archiveUrl"
    try {
        Invoke-WebRequest -Uri $archiveUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 120
        Expand-Archive -Path $zipPath -DestinationPath $mvnPath -Force
        Remove-Item $zipPath -Force
        $mvnCmd = "$extractedDir\bin\mvn.cmd"
        if (Test-Path $mvnCmd) {
            Write-Host "MAVEN_OK: $mvnCmd"
            & $mvnCmd --version
        } else {
            Write-Host "MAVEN_FAIL after archive too"
        }
    } catch {
        Write-Host "ARCHIVE_ERROR: $_"
    }
}
