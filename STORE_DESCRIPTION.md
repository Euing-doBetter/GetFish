# 🇰🇷 [한국어 버전] Chrome 웹스토어 & 프로젝트 소개서

## 🎣 GetFish: 실시간 피싱·사칭 도메인 0.1초 차단 솔루션
**"1초 전에 만들어진 가짜 결제 사이트까지, AI 엔진으로 완벽하게 낚아챕니다!"**

---

### 🔥 왜 GetFish를 꼭 설치해야 할까요? (4대 핵심 이유)

1. **🛡️ 0.1초 신종 사칭(Zero-Day) 도메인 차단**
   * **문제점:** 기존 백신은 이미 피해 신고가 끝난 과거 사이트만 막을 수 있습니다. 해커들은 1분 전 만든 오타 도메인(`navr-pay.com`, `toss-pay-auth.kr`)으로 보안망을 쉽게 뚫습니다.
   * **해결책:** GetFish는 **AI 문자열 유사도 분석 엔진(Levenshtein)**을 탑재해, DB에 없는 신종 오타·사칭 사이트까지 접속 후 0.1초 만에 즉시 잡아냅니다.

2. **⚡️ 금융 사기 마지노선, '0.001초 킬스위치(Kill-Switch)'**
   * **문제점:** 사용자가 가짜 결제창에 속아 주민등록번호나 카드 비밀번호 전체를 입력하는 순간 금전적 피해가 발생합니다.
   * **해결책:** 정상 은행/결제사 창에서 절대 요구하지 않는 **'주민번호 전체' 또는 '카드 비밀번호 4자리'** 입력 폼이 감지되는 즉시, 화면을 강제로 마비시키고 입력을 원천 차단합니다.

3. **🔄 안전한 공식 메인 사이트로 자동 대피 (Safe Redirect)**
   * **문제점:** 위험 사이트를 차단만 하면 사용자는 "그럼 내 진짜 주문이나 결제는 어떻게 확인하지?"라며 불안해합니다.
   * **해결책:** 사칭당한 대상 브랜드(네이버페이, 토스, 쿠팡, 페이팔 등)를 자동 식별하여, 브라우저를 **진짜 안전한 공식 홈페이지(`https://pay.naver.com` 등)**로 안심 이동시킵니다.

4. **👥 부모님까지 지켜주는 '크라우드소싱 집단 방호'**
   * 복잡한 설정 없이 크롬에 추가하기만 하면 즉시 작동합니다!
   * 팝업에서 **[🚨 의심 사이트 제보하기]** 클릭 한 번이면 클라우드 서버에 접수되고, 2단계 검수를 거쳐 전 세계 모든 GetFish 사용자의 브라우저에 **전역 차단이 실시간 동기화**됩니다.

---

### 🛠️ 5대 핵심 기능 (Key Features)

* **🚨 4단계 하이브리드 탐지 엔진:** ① 화이트리스트 검증 ➔ ② 블랙리스트 실시간 차단 ➔ ③ 오타 유사도 분석(Typosquatting) ➔ ④ 브랜드 사칭 및 비정상 결제 폼 전송 경로 감시.
* **🛡️ 민감 정보 킬스위치:** 웹페이지 내 불법적인 개인정보 입력 시도를 0.001초 만에 감지하고 차단 경고 발동.
* **🎨 프리미엄 글래스모피즘 오버레이:** 딥 옵시디언 글래스 테마와 레이더 파동 애니메이션으로 경각심을 극대화하는 경고 모달 제공.
* **🟢 실시간 상태바 대시보드:** 확장 프로그램 팝업에서 현재 보고 있는 탭의 안전 상태(🟢 안전 / 🟡 검증 중 / 🔴 위험)와 누적 차단 통계 즉시 확인.
* **📡 실시간 제보 파이프라인:** 클라우드 서버(`getfish.onrender.com`)와 연동되어 사용자의 1초 제보가 즉시 반영되는 실무형 SecOps 파이프라인.

---
---

# 🇺🇸 [English Version] Chrome Web Store & Project Description

## 🎣 GetFish: Real-Time Zero-Day Phishing & Brand Fraud Shield
**"Intercepting brand impersonation & typosquatting threats in 0.1 seconds—before your payment begins!"**

---

### 🔥 Why You Essential Need GetFish (4 Key Reasons)

1. **🛡️ 0.1s Zero-Day Typosquatting Defense**
   * **The Problem:** Traditional antiviruses only block known domain lists after victims report them. Attackers easily bypass older security layers using freshly registered typos (`navr-pay.com`, `paypaI-secure.com`, `amazon-billing.net`).
   * **The Solution:** Powered by our **AI String Similarity Engine (Levenshtein)**, GetFish analyzes domain heuristics instantly, catching zero-day typosquatting and brand impersonation sites within **0.1 seconds** of page load.

2. **⚡️ Last-Line Financial Kill-Switch (0.001s Response)**
   * **The Problem:** The most catastrophic losses happen when users unknowingly type their full Social Security Numbers (SSN) or complete credit card PINs into deceptive checkout forms.
   * **The Solution:** Our DOM-scanning engine detects illicit data harvesting attempts. If a non-whitelisted site asks for highly sensitive credentials (**Full SSN/RRN or 4-digit Credit Card PINs**), GetFish triggers an emergency **Kill-Switch**, freezing the form and blocking input immediately.

3. **🔄 Smart Safe Redirect to Official Portals**
   * **The Problem:** Simply blocking a dangerous page leaves users stressed, wondering how to check their real order status or payment history safely.
   * **The Solution:** GetFish automatically identifies the targeted brand (e.g., PayPal, Amazon, Chase Bank, Naver Pay) and safely redirects your tab to the **verified official portal (`https://www.paypal.com`, `https://pay.amazon.com`, etc.)**.

4. **👥 Crowd-Sourced Global Threat Intelligence**
   * Protect your elderly parents and non-tech-savvy family members with zero manual configuration!
   * Spot a suspicious domain? One click on **[🚨 Report Suspicious Site]** sends the domain directly to our cloud threat queue. Once verified, global blacklists update instantly, protecting every GetFish installation across the world.

---

### 🛠️ 5 Key Features

* **🚨 4-Stage Hybrid Detection Engine:** ① High-Speed Whitelist Check ➔ ② Real-Time Blocklist Sync ➔ ③ Typosquatting Similarity Analysis ➔ ④ Brand Keyword & Anomalous Form Action Surveillance.
* **🛡️ Sensitive Data Kill-Switch:** Real-time DOM monitoring that freezes illicit input forms requiring high-risk financial secrets in 0.001 seconds.
* **🎨 Premium Glassmorphism Overlay:** A sleek, dark-mode glass UI with pulsating radar animations that immediately alerts users to severe threats.
* **🟢 Live Sync Status Dashboard:** Check your active tab's safety status (🟢 Safe / 🟡 Inspecting / 🔴 Blocked) and your lifetime protection stats with one click.
* **📡 Cloud-Integrated Reporting Pipeline:** Integrated seamlessly with our backend cloud server (`getfish.onrender.com`) for enterprise-grade SecOps crowd-sourced threat mitigation.
