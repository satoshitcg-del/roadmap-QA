# QA Learning Hub - Status Check
param([string]$workspace = "D:\Users\nuttawat.jun\.openclaw\workspace\qa-learning-hub")

$topicsDir = Join-Path $workspace "topics"

$required = @(
    "internet-basics.html","http-https.html","what-is-qa.html","testing-types.html","sdlc-stlc.html",
    "test-scenarios.html","testing-techniques.html","bug-reporting.html","test-documentation.html","risk-based-testing.html","exploratory-testing.html",
    "selenium.html","cypress.html","playwright.html","api-testing.html","cicd-integration.html",
    "performance-testing.html","security-testing.html","accessibility-testing.html","usability-testing.html",
    "mobile-testing.html","database-testing.html","agile-scrum.html","test-management.html"
)

$existing = @(Get-ChildItem -Path $topicsDir -Filter "*.html" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
$missing = $required | Where-Object { $existing -notcontains $_ }

Write-Host "QA Learning Hub Status" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Completed: $($existing.Count)/$($required.Count)" -ForegroundColor Green

if ($missing.Count -eq 0) {
    Write-Host "All topics created!" -ForegroundColor Green
    @{status="complete";total=$required.Count;completed=$existing.Count;timestamp=Get-Date -Format "o"} | ConvertTo-Json | Out-File (Join-Path $workspace "status.json")
    exit 0
} else {
    Write-Host "Missing: $($missing.Count) topics" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkYellow }
    @{status="incomplete";total=$required.Count;completed=$existing.Count;missing=$missing;timestamp=Get-Date -Format "o"} | ConvertTo-Json | Out-File (Join-Path $workspace "status.json")
    exit 1
}