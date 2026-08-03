$ids = 171224..171229
$results = @()
foreach ($id in $ids) {
  $passed = $false
  for ($attempt = 1; $attempt -le 2; $attempt++) {
    $stamp = Get-Date -Format "HHmmss"
    $log = "commands/reports/execution/_run_${id}_${stamp}.log"
    Write-Host ""
    Write-Host "========== RUN $id attempt $attempt =========="
    npx playwright test "src/tests/AIAgent/dfb/DFB-$id.spec.ts" --reporter=list --retries=0 *> $log
    $code = $LASTEXITCODE
    if ($code -eq 0) {
      $passed = $true
      Write-Host "=== PASSED $id ==="
      $results += [pscustomobject]@{ Id = $id; Status = "PASSED"; Exit = 0; Attempts = $attempt }
      break
    }
    $retryable = $false
    if (Test-Path $log) {
      $retryable = Select-String -Path $log -Pattern "CSRF token is invalid|waiting for locator" -Quiet
    }
    Write-Host "=== FAILED $id attempt $attempt ==="
    if (-not $retryable) { break }
    Write-Host "Retryable flake - retrying"
  }
  if (-not $passed) {
    $results += [pscustomobject]@{ Id = $id; Status = "FAILED"; Exit = $code; Attempts = $attempt }
    Write-Host "Stopping cohort on failure"
    break
  }
}
$results | Format-Table -AutoSize
$results | ConvertTo-Json | Set-Content commands/reports/execution/_171224_229_results.json
