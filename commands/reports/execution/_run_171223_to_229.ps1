$ids = 171223..171229
$results = @()
foreach ($id in $ids) {
  $attempt = 1
  $maxAttempts = 2
  $code = 1
  while ($attempt -le $maxAttempts) {
    $log = "commands/reports/execution/_run_${id}_fix${attempt}.log"
    Write-Host ""
    Write-Host "========== RUN $id attempt $attempt =========="
    npx playwright test "src/tests/AIAgent/dfb/DFB-$id.spec.ts" --reporter=list --retries=0 2>&1 | Tee-Object -FilePath $log
    $code = $LASTEXITCODE
    if ($code -eq 0) { break }
    $retryable = Select-String -Path $log -Pattern "CSRF token is invalid|waiting for locator\('//\*\[text\(\)='Load'\]'\)" -Quiet
    if (-not $retryable -or $attempt -eq $maxAttempts) { break }
    Write-Host "Retryable flake on $id - retrying"
    $attempt++
  }
  $status = if ($code -eq 0) { "PASSED" } else { "FAILED" }
  $results += [pscustomobject]@{ Id = $id; Status = $status; Exit = $code; Attempts = $attempt }
  Write-Host "=== $status $id ==="
  if ($code -ne 0) {
    Write-Host "Stopping cohort on failure"
    break
  }
}
$results | Format-Table -AutoSize
$results | ConvertTo-Json | Set-Content commands/reports/execution/_17122x_batch_results2.json
