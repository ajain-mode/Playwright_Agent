# Re-run specs interrupted by manual process kill (exit 4294967295).
# 883352: DFB-61626 smoke (killed on office preconditions)
# 257859: DFB-171325 (killed during TNX retry) — re-run for fresh result
# 821086: batch killed at 171324 login start (171325 had completed in that batch)
# 366505: never green; included for completeness
$ErrorActionPreference = "Continue"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
Set-Location $repo

$cases = @(
  @{ id = "61626"; spec = "src/tests/dfb/tabular/DFB-61626.spec.ts"; note = "883352 smoke killed" },
  @{ id = "366505"; spec = "src/tests/AIAgent/banyan/BANYAN-366505.spec.ts"; note = "Banyan parked" },
  @{ id = "171325"; spec = "src/tests/AIAgent/dfb/DFB-171325.spec.ts"; note = "257859 killed mid-TNX" },
  @{ id = "171324"; spec = "src/tests/AIAgent/dfb/DFB-171324.spec.ts"; note = "821086 killed at login" }
)

$indexLines = @("# Manually-stopped re-run $(Get-Date -Format o)", "")
foreach ($c in $cases) {
  $id = $c.id
  $spec = $c.spec
  Write-Host "======== RE-RUN $id ($($c.note)) ========" -ForegroundColor Cyan
  $log = "commands/reports/execution/_run_${id}_retry.log"
  npx playwright test $spec --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log
  $code = $LASTEXITCODE
  if ($code -eq 0) {
    Write-Host "GREEN $id" -ForegroundColor Green
    $indexLines += "| $id | GREEN | $log |"
  } else {
    Write-Host "PARK $id exit=$code" -ForegroundColor Yellow
    python commands/reports/execution/_park_from_run.py $id "Retry after manual stop. See $log" "Playwright exit $code" $spec
    $indexLines += "| $id | PARKED | exit=$code | $log |"
  }
  Start-Sleep -Seconds 5
}
$indexLines -join "`n" | Set-Content "commands/reports/execution/_batch_manually_stopped_summary.md" -Encoding UTF8
Write-Host "Done. Summary: commands/reports/execution/_batch_manually_stopped_summary.md"
