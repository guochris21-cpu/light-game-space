$ErrorActionPreference = 'Stop'
$sitePath = 'C:\Users\guoru\OneDrive\文档\New project\game-site'
$pythonPort = 8080
$stamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
$logPath = Join-Path $env:TEMP ("cloudflared-$stamp.log")
$errPath = Join-Path $env:TEMP ("cloudflared-$stamp.err.log")

Write-Host 'Starting local web server...' -ForegroundColor Cyan
$py = Start-Process -FilePath python -ArgumentList "-m http.server $pythonPort" -WorkingDirectory $sitePath -PassThru
Start-Sleep -Seconds 2

Write-Host 'Starting public tunnel...' -ForegroundColor Cyan
$cf = Start-Process -FilePath cloudflared -ArgumentList "tunnel --url http://localhost:$pythonPort --no-autoupdate" -RedirectStandardOutput $logPath -RedirectStandardError $errPath -PassThru -WindowStyle Hidden

$url = $null
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-Path $logPath) {
    $txt = Get-Content -Raw $logPath -ErrorAction SilentlyContinue
    if ($txt -match 'https://[-a-z0-9]+\.trycloudflare\.com') {
      $url = $Matches[0]
      break
    }
  }
  if ($cf.HasExited) { break }
}

if ($url) {
  Set-Clipboard -Value $url
  Write-Host ''
  Write-Host 'Public URL (already copied):' -ForegroundColor Green
  Write-Host $url -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Open this link on any device.' -ForegroundColor Green
  Write-Host 'Press Enter here to stop the public link.' -ForegroundColor Yellow
} else {
  Write-Host ''
  Write-Host 'Could not read URL yet. Check network, then retry.' -ForegroundColor Red
  Write-Host "Output log: $logPath" -ForegroundColor DarkYellow
  Write-Host "Error log:  $errPath" -ForegroundColor DarkYellow
  Write-Host 'Press Enter to exit.' -ForegroundColor Yellow
}

try {
  [void](Read-Host)
}
finally {
  if ($cf -and -not $cf.HasExited) { Stop-Process -Id $cf.Id -Force -ErrorAction SilentlyContinue }
  if ($py -and -not $py.HasExited) { Stop-Process -Id $py.Id -Force -ErrorAction SilentlyContinue }
}
