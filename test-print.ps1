$url = "http://localhost:3001/api/admin/printers"

try {
    Write-Host "Getting printers from API..."
    $printers = Invoke-RestMethod -Uri $url -Method Get
    
    if ($printers) {
        $printerId = $printers.id
        Write-Host "Found printer: $($printers.name) (ID: $printerId)"
        
        Write-Host "`nTesting print..."
        $testUrl = "$url/$printerId/test-print"
        $result = Invoke-RestMethod -Uri $testUrl -Method Post
        
        Write-Host "Test print response:"
        Write-Host ($result | ConvertTo-Json)
    } else {
        Write-Host "No printers found"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Stack: $($_.Exception.StackTrace)"
}
