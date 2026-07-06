#!/bin/bash

# ==========================================================
# 🎣 GetFish Phishing Protection Solution - Startup Script
# ==========================================================

echo "=========================================================="
echo "   🎣 GetFish - 실시간 피싱 & 사칭 사이트 차단 솔루션"
echo "=========================================================="
echo ""

# 1. Navigate to project root
cd "$(dirname "$0")" || exit

# 2. Check & Setup Python Virtual Environment
if [ ! -d "backend/venv" ]; then
    echo "📦 [1/4] 파이썬 가상환경(venv)을 생성하고 있습니다..."
    python3 -m venv backend/venv
else
    echo "✅ [1/4] 파이썬 가상환경(venv) 확인 완료!"
fi

# 3. Install Dependencies
echo "📦 [2/4] 백엔드 필수 라이브러리(FastAPI, Uvicorn, RapidFuzz 등) 설치 검증 중..."
./backend/venv/bin/pip install -q -r backend/requirements.txt

# 4. Open Demo Page & Swagger UI in Chrome (Mac)
echo "🌐 [3/4] 크롬 브라우저에서 API 문서 및 모의 피싱 데모 페이지 열기..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Google Chrome" "http://localhost:8000/docs" 2>/dev/null || open "http://localhost:8000/docs" &
    open -a "Google Chrome" "file://$(pwd)/demo/naver_pay_phishing.html" 2>/dev/null || open "file://$(pwd)/demo/naver_pay_phishing.html" &
fi

# 5. Start FastAPI Backend Server
echo "🚀 [4/4] GetFish 4단계 하이브리드 탐지 백엔드 서버 가동 중..."
echo "----------------------------------------------------------"
echo " 👉 백엔드 API 서버 : http://localhost:8000"
echo " 👉 Swagger API 문서: http://localhost:8000/docs"
echo " 👉 🚨 모의 피싱 데모 : file://$(pwd)/demo/naver_pay_phishing.html"
echo "----------------------------------------------------------"
echo " 🛑 서버를 종료하려면 [CTRL + C] 를 누르세요."
echo "----------------------------------------------------------"
echo ""

cd backend || exit
../backend/venv/bin/python main.py
