$ErrorActionPreference = "Continue"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
Set-Location $repo
$cases = @("171324","196261","196262","196263","196264","196274","196275","196276","196277","171221","171222","171223","171224","171225","171226","171227","171228","171229")
$indexLines = @("# Batch run $(Get-Date -Format o)","")
foreach ($id in $cases) {
  $spec = "src/tests/AIAgent/dfb/DFB-$id.spec.ts"
  Write-Host "======== RUNNING $id ========" -ForegroundColor Cyan
  $log = "commands/reports/execution/_run_$id.log"
  npx playwright test $spec --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log
  $code = $LASTEXITCODE
  if ($code -eq 0) {
    $indexLines += "| $id | GREEN |"
  } else {
    python commands/reports/execution/_park_from_run.py $id "See _run_$id.log" "Playwright exit $code" $spec
    $indexLines += "| $id | PARKED | exit=$code |"
  }
}
$indexLines -join "`n" | Set-Content "commands/reports/execution/_batch_summary.md" -Encoding UTF8
Write-Host "Batch complete"
