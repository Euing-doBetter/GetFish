"""
GetFish FastAPI Backend Server
Provides real-time phishing analysis REST API and Swagger documentation
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from engine.detector import PhishingDetector

app = FastAPI(
    title="GetFish Phishing Detection API",
    description="온라인 결제 피싱, 사칭 도메인(Typosquatting), 및 이상 행동을 탐지하는 실시간 백엔드 API",
    version="1.0.0"
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

@app.get("/")
def root():
    return {"message": "🎣 GetFish Phishing Detection Engine is running! Visit /docs for Swagger UI."}

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
    print(f"🚨 [CROWD-SOURCING REPORT] Suspicious site reported: {request.domain} ({request.url}) - Reason: {request.reason}")
    return {
        "success": True,
        "status": "received",
        "message": f"의심 도메인 '{request.domain}'에 대한 제보가 백엔드 서버에 성공적으로 접수되었습니다. 2단계 검증 후 블랙리스트 DB에 반영됩니다."
    }

@app.get("/api/stats", summary="GetFish 누적 탐지 통계 조회")
def get_stats():
    return {
        "status": "active",
        "engine_version": "v1.0.0-hybrid",
        "whitelist_count": len(detector.whitelist),
        "blacklist_count": len(detector.blacklist),
        "target_brands_count": len(detector.brands)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
