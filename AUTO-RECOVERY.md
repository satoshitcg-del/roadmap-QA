# 🔧 QA Learning Hub - Auto Recovery System

ระบบตรวจสอบและแก้ไขอัตโนมัติสำหรับ QA Learning Hub Project

## ⚙️ การทำงาน

### Cron Job (ทุก 5 นาที)
```cron
*/5 * * * * powershell -ExecutionPolicy Bypass -File qa-learning-hub/auto-recovery.ps1
```

### สิ่งที่ตรวจสอบ
1. ✅ **ไฟล์ครบหรือไม่** - ตรวจสอบว่ามีครบ 24 หน้า
2. ✅ **ไฟล์เสียหรือไม่** - ตรวจสอบว่า HTML สมบูรณ์
3. ✅ **ความคืบหน้า** - คำนวณเปอร์เซ็นต์การทำงาน

### การแก้ไขอัตโนมัติ
| ปัญหา | การแก้ไข |
|-------|----------|
| ไฟล์หาย | สร้าง trigger file ให้ agent สร้างต่อ |
| ไฟล์เสีย | ลบและ re-queue |
| Timeout | Restart task |

## 📁 ไฟล์ที่เกี่ยวข้อง

```
qa-learning-hub/
├── auto-recovery.ps1      # Script ตรวจสอบหลัก
├── cron-config.json       # การตั้งค่า cron
├── build-status.json      # สถานะล่าสุด
├── auto-recovery-status.json  # สถานะ recovery
├── cron-monitor.log       # Log การทำงาน
└── .continue-work-trigger # Trigger file (ถ้ามีงานค้าง)
```

## 🚀 การตั้งค่า Cron Job (Windows Task Scheduler)

### วิธีที่ 1: PowerShell Scheduled Job
```powershell
# สร้าง Scheduled Task
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File D:\Users\nuttawat.jun\.openclaw\workspace\qa-learning-hub\auto-recovery.ps1" -WorkingDirectory "D:\Users\nuttawat.jun\.openclaw\workspace"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive

Register-ScheduledTask -TaskName "QA-Hub-Auto-Recovery" -Action $action -Trigger $trigger -Principal $principal -Description "Monitor QA Learning Hub every 5 minutes"
```

### วิธีที่ 2: OpenClaw Native Cron
เพิ่มใน `~/.openclaw/cron/jobs.json`:
```json
{
  "id": "qa-learning-hub-autocontinue",
  "schedule": "*/5 * * * *",
  "enabled": true,
  "target": "isolated",
  "wakeMode": "now",
  "task": "ตรวจสอบโฟลเดอร์ qa-learning-hub/topics/ ว่ามีไฟล์ครบ 24 หน้าตามที่กำหนดใน index.html หรือไม่ ถ้ายังไม่ครบให้สร้างหน้าที่ขาดไปให้เสร็จ ใช้รูปแบบเดียวกับหน้าที่มีอยู่แล้ว และอัปเดตสถานะใน build-status.json"
}
```

## 📊 การติดตามสถานะ

### ดูสถานะล่าสุด
```powershell
Get-Content qa-learning-hub/build-status.json | ConvertFrom-Json
```

### ดู Log
```powershell
tail qa-learning-hub/cron-monitor.log
```

### สถานะที่เป็นไปได้
- `complete` - สร้างครบทุกหน้าแล้ว
- `incomplete` - ยังขาดบางหน้า
- `repairing` - กำลังซ่อมแซมไฟล์เสีย

## 🔄 Auto-Recovery Flow

```
┌─────────────────┐
│ ทุกๆ 5 นาที     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ตรวจสอบไฟล์    │
│ ครบ 24 หน้า?   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌─────────┐
│ ครบ   │  │ ไม่ครบ │
└───┬───┘  └────┬────┘
    │           │
    ▼           ▼
┌───────┐  ┌─────────────┐
│สำเร็จ!│  │สร้าง Trigger│
└───────┘  │ให้ทำงานต่อ  │
           └─────────────┘
```

## 🐛 การแก้ไขปัญหา

### ตรวจสอบว่า Cron ทำงานไหม
```powershell
Get-ScheduledTask -TaskName "QA-Hub-Auto-Recovery" | Get-ScheduledTaskInfo
```

### รัน manual
```powershell
cd D:\Users\nuttawat.jun\.openclaw\workspace
powershell -ExecutionPolicy Bypass -File qa-learning-hub/auto-recovery.ps1
```

### ลบ Trigger file (ถ้าต้องการหยุด)
```powershell
Remove-Item qa-learning-hub/.continue-work-trigger -ErrorAction SilentlyContinue
```

## 📝 Changelog

- **2026-02-24** - สร้างระบบ Auto-Recovery ครั้งแรก
- **Interval** - 5 นาที
- **Total Topics** - 24 หน้า