$r = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = $r.data.token
$h = @{ Authorization = "Bearer $token" }

Write-Host "=== Test 1: TXT template with subjectId=2, gradeId=1 ==="
$res = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/knowledges/template?format=txt&subjectId=2&gradeId=1" -Headers $h
Write-Host $res

Write-Host ""
Write-Host "=== Test 2: Import with chapter name ==="
$filePath = "E:\AI\shanghai-learning\backend\test_name_import.txt"
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$boundary = [System.Guid]::NewGuid().ToString()
$header = "--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"test_name_import.txt`"`r`nContent-Type: text/plain`r`n`r`n"
$footer = "`r`n--$boundary--`r`n"
$headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
$footerBytes = [System.Text.Encoding]::UTF8.GetBytes($footer)
$body = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
[System.Buffer]::BlockCopy($headerBytes, 0, $body, 0, $headerBytes.Length)
[System.Buffer]::BlockCopy($fileBytes, 0, $body, $headerBytes.Length, $fileBytes.Length)
[System.Buffer]::BlockCopy($footerBytes, 0, $body, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)
$result = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/knowledges/import" -Method POST -Headers $h -ContentType "multipart/form-data; boundary=$boundary" -Body $body
Write-Host "Result:"
$result | ConvertTo-Json -Depth 5
