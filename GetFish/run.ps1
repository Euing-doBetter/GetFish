# ==========================================================
# 🎣 GetFish Phishing Protection Solution - PowerShell Script
# ==========================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🎣 GetFish - 실시간 피싱 & 사칭 사이트 차단 솔루션" -ForegroundColor Yellow
Write-Host "=========================================================="
Write-Host ""

# 1. Navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 2. Check & Setup Python Virtual Environment
if (-not (Test-Path "backend/venv")) {
    Write-Host "📦 [1/4] 파이썬 가상환경(venv)을 생성하고 있습니다..." -ForegroundColor Green
    python3 -m venv backend/venv
} else {
    Write-Host "✅ [1/4] 파이썬 가상환경(venv) 확인 완료!" -ForegroundColor Green
}

# 3. Install Dependencies
Write-Host "📦 [2/4] 백엔드 필수 라이브러리(FastAPI, Uvicorn 등) 설치 검증 중..." -ForegroundColor Green
& ./backend/venv/bin/pip install -q -r backend/requirements.txt

# 4. Open Demo Page & Swagger UI in Chrome
Write-Host "🌐 [3/4] 크롬 브라우저에서 API 문서 및 모의 피싱 데모 페이지 열기..." -ForegroundColor Green
if ($IsMacOS -or $env:TERM_PROGRAM -eq "Apple_Terminal" -or (Test-Path "/Applications/Google Chrome.app")) {
    Start-Process -FilePath "open" -ArgumentList "-a 'Google Chrome' 'http://localhost:8000/docs'" -NoNewWindow
    $DemoPath = "file://" + $ScriptDir + "/demo/naver_pay_phishing.html"
    Start-Process -FilePath "open" -ArgumentList "-a 'Google Chrome' '$DemoPath'" -NoNewWindow
}

# 5. Start FastAPI Backend Server
Write-Host "🚀 [4/4] GetFish 4단계 하이브리드 탐지 백엔드 서버 가동 중..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------------"
Write-Host " 👉 백엔드 API 서버 : http://localhost:8000" -ForegroundColor Yellow
Write-Host " 👉 Swagger API 문서: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host " 👉 🚨 모의 피싱 데모 : file://$ScriptDir/demo/naver_pay_phishing.html" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"
Write-Host " 🛑 서버를 종료하려면 [CTRL + C] 를 누르세요." -ForegroundColor Red
Write-Host "----------------------------------------------------------"
Write-Host ""

Set-Location backend
& ../backend/venv/bin/python main.py
