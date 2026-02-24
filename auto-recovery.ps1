# QA Learning Hub - Auto Recovery System
# Cron Job ตรวจสอบและแก้ไขอัตโนมัติทุก 5 นาที

$ErrorActionPreference = "Stop"
$workspace = "D:\Users\nuttawat.jun\.openclaw\workspace"
$qaHub = Join-Path $workspace "qa-learning-hub"
$topicsDir = Join-Path $qaHub "topics"
$logFile = Join-Path $qaHub "cron-monitor.log"
$statusFile = Join-Path $qaHub "auto-recovery-status.json"

function Write-Log {
    param([string]$message, [string]$level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$level] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

function Get-RequiredTopics {
    return @(
        # Phase 1: Basics (5)
        "internet-basics.html","http-https.html","what-is-qa.html","testing-types.html","sdlc-stlc.html",
        # Phase 2: Manual (6)
        "test-scenarios.html","testing-techniques.html","bug-reporting.html","test-documentation.html","risk-based-testing.html","exploratory-testing.html",
        # Phase 3: Automation (5)
        "selenium.html","cypress.html","playwright.html","api-testing.html","cicd-integration.html",
        # Phase 4: Non-Functional (4)
        "performance-testing.html","security-testing.html","accessibility-testing.html","usability-testing.html",
        # Phase 5: Advanced (4)
        "mobile-testing.html","database-testing.html","agile-scrum.html","test-management.html"
    )
}

function Check-TopicFiles {
    $required = Get-RequiredTopics
    $existing = @(Get-ChildItem -Path $topicsDir -Filter "*.html" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
    $missing = $required | Where-Object { $existing -notcontains $_ }
    
    return @{
        total = $required.Count
        completed = $existing.Count
        missing = $missing
        missingCount = $missing.Count
        percentComplete = [math]::Round(($existing.Count / $required.Count) * 100, 1)
    }
}

function Check-CorruptedFiles {
    param([array]$files)
    $corrupted = @()
    foreach ($file in $files) {
        $path = Join-Path $topicsDir $file
        if (Test-Path $path) {
            $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
            # ตรวจสอบว่าไฟล์มีเนื้อหาครบถ้วน
            if (-not $content -or 
                $content.Length -lt 1000 -or 
                -not ($content -match "</html>") -or
                -not ($content -match "quiz-section")) {
                $corrupted += $file
                Write-Log "พบไฟล์เสีย: $file" "WARN"
            }
        }
    }
    return $corrupted
}

function Repair-CorruptedFile {
    param([string]$filename)
    Write-Log "กำลังซ่อมแซมไฟล์: $filename" "REPAIR"
    # ลบไฟล์เสียแล้วเพิ่มเข้า queue ให้สร้างใหม่
    $path = Join-Path $topicsDir $filename
    if (Test-Path $path) {
        Remove-Item $path -Force
    }
    return $true
}

# ===== MAIN EXECUTION =====

try {
    Write-Log "=== Starting Auto-Recovery Check ==="
    
    # 1. ตรวจสอบสถานะปัจจุบัน
    $status = Check-TopicFiles
    Write-Log "Progress: $($status.completed)/$($status.total) ($($status.percentComplete)%)" "STATUS"
    
    # 2. บันทึกสถานะ
    $statusObj = @{
        timestamp = Get-Date -Format "o"
        checkType = "auto-recovery"
        total = $status.total
        completed = $status.completed
        missingCount = $status.missingCount
        missingFiles = $status.missing
        percentComplete = $status.percentComplete
        isComplete = ($status.missingCount -eq 0)
    }
    $statusObj | ConvertTo-Json | Out-File $statusFile -Encoding UTF8
    
    # 3. ตรวจสอบไฟล์เสีย
    $existingFiles = @(Get-ChildItem -Path $topicsDir -Filter "*.html" | Select-Object -ExpandProperty Name)
    $corrupted = Check-CorruptedFiles -files $existingFiles
    
    if ($corrupted.Count -gt 0) {
        Write-Log "พบไฟล์เสีย $($corrupted.Count) ไฟล์" "WARN"
        foreach ($file in $corrupted) {
            Repair-CorruptedFile -filename $file
        }
        # เพิ่มไฟล์ที่ซ่อมแล้วเข้าไปใน missing list
        $status.missing += $corrupted
    }
    
    # 4. ตรวจสอบว่าต้องส่งแจ้งเตือนหรือไม่
    $lastNotifyFile = Join-Path $qaHub ".last-notify"
    $shouldNotify = $true
    if (Test-Path $lastNotifyFile) {
        $lastNotify = Get-Content $lastNotifyFile
        if ($lastNotify -eq (Get-Date -Format "yyyy-MM-dd-HH")) {
            $shouldNotify = $false
        }
    }
    
    # 5. สรุปผล
    if ($status.missingCount -eq 0) {
        Write-Log "✅ QA Learning Hub สมบูรณ์แล้ว!" "SUCCESS"
        exit 0
    } else {
        Write-Log "⏳ ยังขาดอีก $($status.missingCount) หน้า" "PENDING"
        
        # สร้าง trigger file ให้ agent ทำงานต่อ
        $triggerFile = Join-Path $workspace ".continue-work-trigger"
        @{
            timestamp = Get-Date -Format "o"
            action = "continue-qa-topics"
            missingFiles = $status.missing
            reason = "auto-recovery-check"
        } | ConvertTo-Json | Out-File $triggerFile -Encoding UTF8
        
        Write-Log "🔄 สร้าง trigger ให้ทำงานต่อ: $triggerFile" "TRIGGER"
        
        # บันทึกเวลา notify ถ้าจะแจ้ง
        if ($shouldNotify) {
            Get-Date -Format "yyyy-MM-dd-HH" | Out-File $lastNotifyFile
        }
        
        exit 1
    }
} catch {
    Write-Log "❌ Error: $($_.Exception.Message)" "ERROR"
    exit 1
}