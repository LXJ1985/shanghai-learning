@echo off
echo STARTING_MAVEN_INSTALL

set MVN_VERSION=3.9.9
set MVN_URL=https://dlcdn.apache.org/maven/maven-3/%MVN_VERSION%/binaries/apache-maven-%MVN_VERSION%-bin.zip
set MVN_PATH=E:\AI\tools
set ZIP_PATH=%MVN_PATH%\maven.zip

if exist "%MVN_PATH%\apache-maven-%MVN_VERSION%\bin\mvn.cmd" (
    echo MAVEN_ALREADY_INSTALLED
    "%MVN_PATH%\apache-maven-%MVN_VERSION%\bin\mvn.cmd" --version
    goto :END
)

if not exist "%MVN_PATH%" mkdir "%MVN_PATH%"

echo Downloading Maven %MVN_VERSION%...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%MVN_URL%', '%ZIP_PATH%')"
if errorlevel 1 (
    echo PRIMARY_DOWNLOAD_FAILED
    echo Trying archive...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://archive.apache.org/dist/maven/maven-3/%MVN_VERSION%/binaries/apache-maven-%MVN_VERSION%-bin.zip', '%ZIP_PATH%')"
    if errorlevel 1 (
        echo ARCHIVE_DOWNLOAD_FAILED
        goto :END
    )
)

echo DOWNLOAD_OK
echo Extracting...
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_PATH%', '%MVN_PATH%')"
del "%ZIP_PATH%" 2>nul

if exist "%MVN_PATH%\apache-maven-%MVN_VERSION%\bin\mvn.cmd" (
    echo MAVEN_OK
    "%MVN_PATH%\apache-maven-%MVN_VERSION%\bin\mvn.cmd" --version
) else (
    echo MAVEN_NOT_FOUND_AFTER_EXTRACT
    dir "%MVN_PATH%"
)

:END
echo INSTALL_SCRIPT_DONE
