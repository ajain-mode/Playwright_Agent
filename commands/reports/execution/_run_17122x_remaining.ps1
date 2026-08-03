$ids = 171222..171229
$results = @()
foreach ($id in $ids) {
  $log = "commands/reports/execution/_run_${id}_fix.log"
  Write-Host ""
  Write-Host "========== RUN $id =========="
  npx playwright test "src/tests/AIAgent/dfb/DFB-$id.spec.ts" --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log
  $code = $LASTEXITCODE
  if ($code -ne 0) {
    $csrf = Select-String -Path $log -Pattern "CSRF token is invalid" -Quiet
    if ($csrf) {
      Write-Host "CSRF flake on $id - retrying once"
      $log2 = "commands/reports/execution/_run_${id}_fix2.log"
      npx playwright test "src/tests/AIAgent/dfb/DFB-$id.spec.ts" --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log2
      $code = $LASTEXITCODE
      $log = $log2
    }
  }
  $status = if ($code -eq 0) { "PASSED" } else { "FAILED" }
  $results += [pscustomobject]@{ Id = $id; Status = $status; Exit = $code }
  Write-Host "=== $status $id ==="
  if ($code -ne 0) {
    Write-Host "Stopping cohort on failure"
    break
  }
}
$results | Format-Table -AutoSize
$results | ConvertTo-Json | Set-Content commands/reports/execution/_17122x_batch_results.json
