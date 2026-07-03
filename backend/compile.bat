@echo off
set JAVA_HOME=E:\developtool\jdk17
cd /d E:\AI\shanghai-learning\backend
E:\AI\tools\apache-maven-3.9.9\bin\mvn.cmd package -Dmaven.test.skip=true -q
echo EXIT_CODE=%ERRORLEVEL%
