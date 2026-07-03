$ErrorActionPreference = "Continue"
$logFile = "E:\AI\shanghai-learning\install-result.log"

# Create tools directory
New-Item -ItemType Directory -Path "E:\AI\tools" -Force | Out-Null

# Check if Maven already exists
$mvnCmd = "E:\AI\tools\apache-maven-3.9.9\bin\mvn.cmd"
if (Test-Path $mvnCmd) {
    "MAVEN_ALREADY_EXISTS" | Out-File $logFile
    & $mvnCmd --version 2>&1 | Out-File $logFile -Append
    exit 0
}

# Download Maven 3.9.9
$mvnUrl = "https://dlcdn.apache.org/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip"
$zipPath = "E:\AI\tools\maven-3.9.9.zip"
$mvnPath = "E:\AI\tools"

"Downloading Maven from $mvnUrl ..." | Out-File $logFile

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($mvnUrl, $zipPath)
    "Download complete." | Out-File $logFile -Append
    
    # Extract
    "Extracting..." | Out-File $logFile -Append
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $mvnPath)
    "Extraction complete." | Out-File $logFile -Append
    
    # Cleanup zip
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    
    # Verify
    if (Test-Path $mvnCmd) {
        "MAVEN_OK" | Out-File $logFile -Append
        & $mvnCmd --version 2>&1 | Out-File $logFile -Append
    } else {
        "MAVEN_FAIL: mvn.cmd not found" | Out-File $logFile -Append
        Get-ChildItem $mvnPath | Select-Object Name | Out-File $logFile -Append
    }
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $logFile -Append
    
    # Try archive URL
    $archiveUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip"
    "Trying archive: $archiveUrl" | Out-File $logFile -Append
    try {
        $wc.DownloadFile($archiveUrl, $zipPath)
        "Archive download complete." | Out-File $logFile -Append
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $mvnPath)
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        if (Test-Path $mvnCmd) {
            "MAVEN_OK_FROM_ARCHIVE" | Out-File $logFile -Append
            & $mvnCmd --version 2>&1 | Out-File $logFile -Append
        } else {
            "MAVEN_FAIL_AFTER_ARCHIVE" | Out-File $logFile -Append
        }
    } catch {
        "ARCHIVE_ERROR: $($_.Exception.Message)" | Out-File $logFile -Append
    }
}
