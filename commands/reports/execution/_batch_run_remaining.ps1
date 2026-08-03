# Run remaining AIAgent DFB specs once each; park on fail; continue.
$ErrorActionPreference = "Continue"
$cases = @(
  "171325","171324",
  "196261","196262","196263","196264",
  "196274","196275","196276","196277",
  "171221","171222","171223","171224","171225","171226","171227","171228","171229"
)
$root = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
# script lives in commands/reports/execution -> repo root is 3 levels up
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
Set-Location $repo
$indexLines = @()
$indexLines += "# Batch run $(Get-Date -Format o)"
$indexLines += ""

foreach ($id in $cases) {
  $spec = "src/tests/AIAgent/dfb/DFB-$id.spec.ts"
  if (-not (Test-Path $spec)) {
    $indexLines += "| $id | MISSING SPEC |"
    continue
  }
  Write-Host "======== RUNNING $id ========" -ForegroundColor Cyan
  $log = "commands/reports/execution/_run_$id.log"
  npx playwright test $spec --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log
  $code = $LASTEXITCODE
  if ($code -eq 0) {
    Write-Host "GREEN $id" -ForegroundColor Green
    $indexLines += "| $id | GREEN | see $log |"
  } else {
    Write-Host "PARK $id exit=$code" -ForegroundColor Yellow
    $how = "See `_run_$id.log` and test-results artifacts."
    $blocker = "Playwright exit code $code (not green after this run)."
    python commands/reports/execution/_park_from_run.py $id $how $blocker $spec
    $indexLines += "| $id | PARKED | exit=$code | `execution/$id/` |"
  }
}

$indexLines -join "`n" | Set-Content -Path "commands/reports/execution/_batch_summary.md" -Encoding UTF8
Write-Host "Batch complete. Summary: commands/reports/execution/_batch_summary.md"
