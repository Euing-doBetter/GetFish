"""
GetFish FastAPI Backend Server
Provides real-time phishing analysis REST API and Swagger documentation
"""

import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from engine.detector import PhishingDetector

app = FastAPI(
    title="GetFish Phishing Detection API",
    description="온라인 결제 피싱, 사칭 도메인(Typosquatting), 및 이상 행동을 탐지하는 실시간 백엔드 API",
    version="1.0.2"
)

# Enable CORS for Chrome Extension requests (<all_urls>)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Detector Engine
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
detector = PhishingDetector(data_dir=DATA_DIR)

# Pydantic Request Models
class PageAnalyzeRequest(BaseModel):
    url: str = Field(..., description="접속한 웹페이지 전체 URL")
    domain: str = Field(..., description="접속한 웹페이지 도메인 (예: navr-pay-secure.com)")
    title: Optional[str] = Field("", description="웹페이지 제목 (<title>)")
    formActions: Optional[List[str]] = Field([], description="페이지 내 <form> 태그들의 action 속성 목록")
    inputTypes: Optional[List[str]] = Field([], description="페이지 내 input 필드들의 type 또는 name 목록")
    contentSnippet: Optional[str] = Field("", description="페이지 본문 텍스트 요약 (최대 1000자)")

class AnalyzeResponse(BaseModel):
    is_phishing: bool
    score: int
    reason: str
    badge_text: str
    redirect_url: str

class ReportRequest(BaseModel):
    url: str = Field(..., description="의심되는 웹페이지 전체 URL")
    domain: str = Field(..., description="의심 도메인 (예: c0upang-sale.kr)")
    reason: Optional[str] = Field("사용자 의심 제보", description="제보 사유")

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.get("/api/stats", summary="GetFish 탐지 엔진 실시간 통계")
def get_stats():
    reports_file = os.path.join(DATA_DIR, "reports.json")
    report_count = 0
    if os.path.exists(reports_file):
        try:
            with open(reports_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                report_count = len(data) if isinstance(data, list) else len(data.get("reports", []))
        except Exception:
            pass
    return {
        "status": "active",
        "engine_status": "ONLINE",
        "version": "1.0.2",
        "engine_version": "v1.0.2-hybrid",
        "whitelist_count": len(detector.whitelist),
        "blacklist_count": len(detector.blacklist),
        "target_brands_count": len(detector.brands),
        "report_count": report_count
    }

@app.get("/", response_class=HTMLResponse, summary="GetFish 공식 홈페이지 및 실시간 대시보드")
def root():
    index_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>🎣 GetFish Phishing Detection Engine is running! Visit <a href='/docs'>/docs</a> for Swagger UI.</h1>"

@app.get("/reports", response_class=HTMLResponse, summary="의심 피싱 사이트 크라우드소싱 실시간 제보 대시보드")
def reports_dashboard():
    reports_path = os.path.join(os.path.dirname(__file__), "static", "reports.html")
    if os.path.exists(reports_path):
        with open(reports_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>🚨 GetFish Reports Dashboard is loading...</h1>"

@app.post("/api/analyze", response_model=AnalyzeResponse, summary="웹페이지 피싱 위험도 실시간 검증")
def analyze_page(request: PageAnalyzeRequest):
    try:
        payload = request.model_dump()
        result = detector.analyze(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engine analysis error: {str(e)}")

@app.post("/api/report", summary="의심 피싱 사이트 크라우드 소싱 제보 접수")
def report_page(request: ReportRequest):
    log_msg = f"🚨 [CROWD-SOURCING REPORT] Suspicious site reported: {request.domain} ({request.url}) - Reason: {request.reason}"
    print(log_msg)
    
    # Save to reports.json for admin verification queue
    reports_file = os.path.join(DATA_DIR, "reports.json")
    reports_data = []
    if os.path.exists(reports_file):
        try:
            with open(reports_file, "r", encoding="utf-8") as f:
                reports_data = json.load(f)
        except Exception:
            reports_data = []
            
    report_entry = {
        "timestamp": datetime.now().isoformat(),
        "domain": request.domain,
        "url": request.url,
        "reason": request.reason,
        "status": "pending_verification"
    }
    reports_data.append(report_entry)
    
    try:
        with open(reports_file, "w", encoding="utf-8") as f:
            json.dump(reports_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Failed to save report log: {e}")

    return {
        "success": True,
        "status": "received",
        "message": f"의심 도메인 '{request.domain}'에 대한 제보가 백엔드 서버에 성공적으로 접수되었습니다. 2단계 검증 후 블랙리스트 DB에 반영됩니다."
    }

@app.get("/api/reports", summary="관리자용 의심 피싱 사이트 제보 대기열 조회")
def get_reports():
    reports_file = os.path.join(DATA_DIR, "reports.json")
    if os.path.exists(reports_file):
        try:
            with open(reports_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
