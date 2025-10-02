Write-Host "Cleaning build folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploying to Firebase..." -ForegroundColor Yellow
    firebase deploy --only hosting:kanvaportal-goals
    Write-Host "Deployment complete!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}