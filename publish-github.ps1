param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUser,
  [string]$RepoName = "my-games"
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\GitHub CLI;C:\Program Files\Git\cmd;" + $env:Path

$sitePath = "C:\Users\guoru\OneDrive\文档\New project\game-site"
Set-Location $sitePath

Write-Host "Checking GitHub auth..."
try {
  gh auth status | Out-Null
} catch {
  Write-Host "Not logged in. Run this first:" -ForegroundColor Yellow
  Write-Host "gh auth login --web --git-protocol https --hostname github.com" -ForegroundColor Yellow
  exit 1
}

$repoFull = "$GitHubUser/$RepoName"

# Ensure a clean origin setup
$hasOrigin = (git remote | Select-String -Pattern "^origin$")
if ($hasOrigin) {
  git remote remove origin
}

Write-Host "Creating/pushing repo $repoFull ..."
# If repo exists, just set remote and push
$repoExists = $false
try {
  gh repo view $repoFull | Out-Null
  $repoExists = $true
} catch {
  $repoExists = $false
}

if (-not $repoExists) {
  gh repo create $repoFull --public --source . --remote origin --push
} else {
  git remote add origin "https://github.com/$repoFull.git"
  git push -u origin main
}

Write-Host "Enabling GitHub Pages..."
$pagesConfigured = $true
try {
  gh api -X POST "repos/$repoFull/pages" -F "source[branch]=main" -F "source[path]=/" | Out-Null
} catch {
  $pagesConfigured = $false
}

if (-not $pagesConfigured) {
  try {
    gh api -X PUT "repos/$repoFull/pages" -F "source[branch]=main" -F "source[path]=/" | Out-Null
    $pagesConfigured = $true
  } catch {
    Write-Host "Could not auto-enable Pages. Open repo Settings -> Pages and set branch main /(root)." -ForegroundColor Yellow
  }
}

$siteUrl = "https://$GitHubUser.github.io/$RepoName/"
Write-Host "Done. Site URL: $siteUrl" -ForegroundColor Green
Write-Host "Pages may take 1-3 minutes to become available."
