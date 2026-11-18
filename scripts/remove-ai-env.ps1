$envFile = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "No .env.local file found. Nothing to clean."
  exit 0
}
$patterns = '^\s*(AI_[A-Z0-9_]*|OPENAI_[A-Z0-9_]*|GEMINI_[A-Z0-9_]*|ANTHROPIC_[A-Z0-9_]*)\s*='
$lines = Get-Content $envFile
$kept = @($lines | Where-Object { $_ -notmatch $patterns })
$removed = $lines.Count - $kept.Count
Set-Content -Path $envFile -Value $kept -Encoding utf8
Write-Host "Removed $removed obsolete AI environment variable line(s). Firebase and unrelated settings were preserved."
