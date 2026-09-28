$env:CHROME_FLAGS = "--headless"
Set-Location "C:\Users\Caio Locarelli\imd-optimizer\frontend"
Write-Host "Starting Next.js server on port 3000..."
& npx next start -p 3000