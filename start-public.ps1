$ErrorActionPreference = 'Stop'
$sitePath = 'C:\Users\guoru\OneDrive\文档\New project\game-site'
$pythonPort = 8080

Write-Host 'Starting local web server...'
$py = Start-Process -FilePath python -ArgumentList "-m http.server $pythonPort" -WorkingDirectory $sitePath -PassThru
Start-Sleep -Seconds 2

Write-Host ''
Write-Host 'Public URL will appear below (look for trycloudflare.com):' -ForegroundColor Cyan
Write-Host 'Keep this window open while sharing the link.' -ForegroundColor Yellow
Write-Host ''

try {
  cloudflared tunnel --url "http://localhost:$pythonPort" --no-autoupdate
}
finally {
  if ($py -and -not $py.HasExited) {
    Stop-Process -Id $py.Id -Force -ErrorAction SilentlyContinue
  }
}
