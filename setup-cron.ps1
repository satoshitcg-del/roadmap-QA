# Setup Windows Scheduled Task for QA Hub Auto-Recovery
# รันสคริปต์นี้เพื่อตั้งค่า Cron Job บน Windows

$taskName = "QA-Hub-Auto-Recovery"
$scriptPath = "D:\Users\nuttawat.jun\.openclaw\workspace\qa-learning-hub\auto-recovery.ps1"
$workDir = "D:\Users\nuttawat.jun\.openclaw\workspace"

Write-Host "🔧 Setting up QA Hub Auto-Recovery Task..." -ForegroundColor Cyan

# ลบ Task เดิมถ้ามี
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# สร้าง Action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`"" `
    -WorkingDirectory $workDir

# สร้าง Trigger (ทุก 5 นาที)
$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration ([System.TimeSpan]::MaxValue)

# สร้าง Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

# สร้าง Principal
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# ลงทะเบียน Task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Monitor QA Learning Hub every 5 minutes and auto-recover if needed"

Write-Host "✅ Task '$taskName' created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Task Details:" -ForegroundColor Cyan
Write-Host "  - Runs every: 5 minutes"
Write-Host "  - Script: $scriptPath"
Write-Host "  - Working Directory: $workDir"
Write-Host ""
Write-Host "🔍 Commands to manage:" -ForegroundColor Cyan
Write-Host "  - View status: Get-ScheduledTask -TaskName '$taskName'"
Write-Host "  - Run now: Start-ScheduledTask -TaskName '$taskName'"
Write-Host "  - Stop: Stop-ScheduledTask -TaskName '$taskName'"
Write-Host "  - Disable: Disable-ScheduledTask -TaskName '$taskName'"
Write-Host "  - Remove: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
Write-Host ""
Write-Host "📝 Logs location: $workDir\qa-learning-hub\cron-monitor.log" -ForegroundColor Gray