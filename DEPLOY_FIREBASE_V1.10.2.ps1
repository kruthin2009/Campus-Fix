$ErrorActionPreference = "Stop"
Write-Host "CampusFix V1.10.2 - Firebase rules deployment" -ForegroundColor Cyan
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  Write-Error "Firebase CLI is not installed. Install Firebase CLI, then run this script again."
}
firebase use campusfix-52445
firebase deploy --only firestore:rules,storage
Write-Host "Firebase rules deployment completed. Sign out/in to CampusFix and test Announcements again." -ForegroundColor Green
