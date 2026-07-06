"""
GetFish 4-Step Hybrid Phishing Detection Engine
1. Whitelist Check
2. Blacklist Check
3. Levenshtein Typosquatting Analysis (rapidfuzz)
4. Anomaly & Impersonation Analysis (Brand keywords, Form action anomalies, Domain heuristics)
"""

import json
import os
import re
from typing import Dict, Any, List, Optional
from rapidfuzz.distance import Levenshtein
from rapidfuzz import fuzz

class PhishingDetector:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.whitelist = self._load_json("whitelist.json", "whitelist")
        self.blacklist = self._load_json("blacklist.json", "blacklist")
        self.brands = self._load_json("brands.json", "brands")

    def _load_json(self, filename: str, key: str) -> List[Any]:
        path = os.path.join(self.data_dir, filename)
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get(key, [])
        except Exception as e:
            print(f"[Error] Failed to load {filename}: {e}")
            return []

    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = payload.get("url", "")
        domain = payload.get("domain", "").lower()
        title = payload.get("title", "").lower()
        content = payload.get("contentSnippet", "").lower()
        form_actions = payload.get("formActions", [])

        # --- Step 1: Whitelist Check ---
        if any(domain.endswith(w) for w in self.whitelist):
            return {
                "is_phishing": False,
                "score": 0,
                "reason": "검증된 공식 안전 도메인입니다.",
                "badge_text": "🟢 안전",
                "redirect_url": ""
            }

        # --- Step 2: Blacklist Check ---
        if any(b in domain for b in self.blacklist):
            return {
                "is_phishing": True,
                "score": 100,
                "reason": f"접속하신 도메인(<strong>{domain}</strong>)은 실시간 블랙리스트 DB에 등록된 악성 피싱 사이트입니다.",
                "badge_text": "🔴 블랙리스트 차단",
                "redirect_url": "https://pay.naver.com"
            }

        # --- Step 3: Levenshtein Typosquatting Analysis ---
        for brand in self.brands:
            brand_name = brand.get("name")
            redirect_url = brand.get("redirect_url")
            official_domains = brand.get("official_domains", [])
            keywords = brand.get("keywords", [])

            # 3-A. Brand Keyword in Domain Check (e.g., 'toss-pay-auth.kr', 'naver-pay-login.com')
            for kw in keywords:
                if len(kw) >= 3 and kw.lower() in domain and domain not in official_domains and not any(w in domain for w in self.whitelist):
                    return {
                        "is_phishing": True,
                        "score": 90,
                        "reason": f"도메인 주소(<strong>{domain}</strong>)에 공식 브랜드명(<strong>{kw}</strong>)을 무단 포함하여 사칭하고 있습니다.<br/><strong>{brand_name}</strong> 공식 서비스가 아닌 피싱/스미싱 사이트입니다.",
                        "badge_text": "🚨 브랜드 도메인 사칭",
                        "redirect_url": redirect_url
                    }

            # 3-B. Levenshtein / String Similarity Check (e.g., 'naevr.com' vs 'naver.com')
            for official_dom in official_domains:
                dist = Levenshtein.distance(domain, official_dom)
                similarity = fuzz.ratio(domain, official_dom)

                # Require high similarity (>= 85%) AND small distance (<= 2) to prevent false positives like render.com vs naver.com
                if (similarity >= 85 and dist <= 2) and domain not in official_domains:
                    return {
                        "is_phishing": True,
                        "score": 85,
                        "reason": f"공식 도메인(<strong>{official_dom}</strong>)과 문자열이 매우 유사한 오타 도메인(Typosquatting)입니다.<br/><strong>{brand_name}</strong>을(를) 사칭하는 피싱 사이트로 판단됩니다.",
                        "badge_text": "🚨 유사 도메인 사칭",
                        "redirect_url": redirect_url
                    }

        # --- Step 4: Brand Impersonation & Form Action Anomaly (Non-typo Arbitrary Domains) ---
        for brand in self.brands:
            brand_name = brand.get("name")
            keywords = brand.get("keywords", [])
            redirect_url = brand.get("redirect_url")
            official_domains = brand.get("official_domains", [])

            # Check if title or content explicitly mentions brand keywords
            has_brand_keyword = any(kw in title or kw in content for kw in keywords)

            if has_brand_keyword:
                # Since we already passed Step 1 Whitelist, this arbitrary domain is claiming to be Naver Pay/Toss/etc.!
                # Let's inspect Form Actions if present
                has_suspicious_form = False
                for action in form_actions:
                    action_lower = action.lower()
                    # If form action submits to an external IP, discord webhook, or non-whitelisted domain
                    if "http" in action_lower and not any(w in action_lower for w in self.whitelist):
                        has_suspicious_form = True
                        break

                if has_suspicious_form or "결제" in title or "pay" in title or "order" in title:
                    return {
                        "is_phishing": True,
                        "score": 95,
                        "reason": f"도메인 주소가 공식 주소가 아님에도 불구하고 <strong>'{brand_name}'</strong> 관련 키워드 및 결제 창을 사칭하고 있습니다.<br/>결제 정보가 외부 비정상 서버로 전송될 위험이 높습니다.",
                        "badge_text": "🚨 브랜드 사칭 피싱",
                        "redirect_url": redirect_url
                    }

        # --- Default Safe / Unknown ---
        return {
            "is_phishing": False,
            "score": 10,
            "reason": "특별한 사칭 의심 지표나 피싱 패턴이 감지되지 않았습니다.",
            "badge_text": "🟢 안전",
            "redirect_url": ""
        }
