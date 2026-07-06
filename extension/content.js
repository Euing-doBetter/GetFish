/**
 * GetFish Content Script
 * 1. Kill-Switch: Detects prompts for Resident Registration Number / Card Password
 * 2. DOM Scraper: Collects URL, DOM title, and form action endpoints
 * 3. Overlay Injector: Injects Glassmorphism Red Alert modal on phishing detection
 */

(function () {
  'use strict';

  let isOverlayShown = false;

  // Sensitive keywords that legitimate PGs NEVER ask for directly on web checkouts
  const KILL_SWITCH_KEYWORDS = [
    '주민등록번호',
    '주민번호',
    '카드 비밀번호',
    '카드비밀번호',
    '계좌 비밀번호',
    '공동인증서 암호',
    '공동인증서 비밀번호',
    'CVC 전체',
    '보안카드'
  ];

  /**
   * 1. Kill-Switch Detector
   * Scans inputs, placeholders, labels, and text around payment forms
   */
  function checkKillSwitch() {
    if (isOverlayShown) return;

    // 1. Find all user data input fields (text, password, tel, number, etc.)
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="tel"], input[type="number"], input:not([type])');
    if (!inputs || inputs.length === 0) return; // No input fields = No financial data theft possible (e.g. news articles, blog posts)!

    for (const input of inputs) {
      // Collect text closely associated with this input field
      let associatedText = [
        input.placeholder || '',
        input.name || '',
        input.id || '',
        input.getAttribute('aria-label') || '',
        input.value || ''
      ].join(' ');

      // Find associated label tag
      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) associatedText += ' ' + label.innerText;
      }

      // Also check immediate enclosing form group / wrapper (up to 3 levels up, if text length < 300 chars)
      let parent = input.parentElement;
      let depth = 0;
      while (parent && depth < 3) {
        if (parent.innerText && parent.innerText.length < 300) {
          associatedText += ' ' + parent.innerText;
        }
        parent = parent.parentElement;
        depth++;
      }

      associatedText = associatedText.trim();
      if (!associatedText) continue;

      for (const keyword of KILL_SWITCH_KEYWORDS) {
        if (associatedText.includes(keyword)) {
          // Verify with background worker that we are NOT on an official whitelisted domain (e.g. pay.naver.com, gov.kr, google.com)
          chrome.runtime.sendMessage(
            { type: 'VERIFY_KILL_SWITCH', keyword: keyword, domain: window.location.hostname },
            (res) => {
              if (res && res.shouldBlock && !isOverlayShown) {
                triggerKillSwitch(keyword);
              }
            }
          );
          return;
        }
      }
    }
  }

  /**
   * Helper: Smartly detect target brand from DOM / Title / URL
   */
  function getSmartRedirectUrl() {
    const text = (document.title + ' ' + (document.body ? document.body.innerText : '') + ' ' + window.location.href).toLowerCase();
    if (text.includes('toss') || text.includes('토스')) return 'https://toss.im';
    if (text.includes('coupang') || text.includes('쿠팡')) return 'https://www.coupang.com';
    if (text.includes('kakao') || text.includes('카카오')) return 'https://pay.kakao.com';
    if (text.includes('inicis') || text.includes('이니시스')) return 'https://www.inicis.com';
    if (text.includes('kcp') || text.includes('payco') || text.includes('페이코')) return 'https://www.kcp.co.kr';
    return 'https://pay.naver.com';
  }

  /**
   * Trigger Kill-Switch Modal Immediately
   */
  function triggerKillSwitch(detectedKeyword) {
    if (isOverlayShown) return;
    isOverlayShown = true;

    console.warn(`[GetFish Kill-Switch] Sensitive prompt detected: "${detectedKeyword}"`);

    // Notify background worker to log stats & update badge
    chrome.runtime.sendMessage({
      type: 'KILL_SWITCH_TRIGGERED',
      url: window.location.href,
      keyword: detectedKeyword
    });

    const reason = `정상적인 온라인 결제창(PG사)에서는 절대로 <strong>'${detectedKeyword}'</strong> 입력을 요구하지 않습니다.<br/>금융 개인정보 통째 탈취를 노리는 <strong>100% 악성 피싱 사이트</strong>입니다. 절대 입력하지 마세요!`;
    
    const targetUrl = getSmartRedirectUrl();
    showPhishingModal('KILL-SWITCH 발동 (금융정보 탈취 의심)', reason, targetUrl);
  }

  /**
   * 2. Scrape Page Metadata & Form Actions and Send to Background
   */
  function analyzePageMetadata() {
    if (isOverlayShown) return;

    const forms = document.querySelectorAll('form');
    const formActions = [];
    const inputTypes = [];

    forms.forEach((form) => {
      const action = form.getAttribute('action');
      if (action) formActions.push(action);
    });

    document.querySelectorAll('input').forEach((input) => {
      const type = input.getAttribute('type') || input.getAttribute('name') || '';
      if (type) inputTypes.push(type.toLowerCase());
    });

    const payload = {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      formActions: formActions,
      inputTypes: inputTypes,
      contentSnippet: document.body ? document.body.innerText.substring(0, 1000) : ''
    };

    // Send to Background Worker for Whitelist/Blacklist/Backend AI check
    chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', data: payload }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[GetFish] Background worker communication error:', chrome.runtime.lastError.message);
        return;
      }

      if (response && response.status === 'PHISHING') {
        if (!isOverlayShown) {
          isOverlayShown = true;
          showPhishingModal(
            response.title || '피싱 및 사칭 사이트 감지',
            response.reason || '공식 결제 도메인을 사칭하는 유사 도메인 또는 악성 사이트로 판별되었습니다.',
            response.redirectUrl || 'https://pay.naver.com'
          );
        } else if (response.redirectUrl) {
          // Update redirect URL if modal was already shown by Kill-Switch
          const safeBtn = document.getElementById('getfish-btn-safe-redirect');
          if (safeBtn) {
            safeBtn.onclick = () => { window.location.href = response.redirectUrl; };
          }
        }
      }
    });
  }

  /**
   * 3. Inject Stunning Glassmorphism Warning Modal
   */
  function showPhishingModal(badgeText, reasonText, redirectUrl) {
    // Remove any existing modal just in case
    const existing = document.getElementById('getfish-killswitch-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'getfish-killswitch-overlay';

    overlay.innerHTML = `
      <div class="getfish-modal-card">
        <div class="getfish-icon-wrapper">
          <span class="getfish-icon-text">🚨</span>
        </div>
        <div class="getfish-badge">${badgeText}</div>
        <h2 class="getfish-title">결제를 즉시 중단하세요!</h2>
        
        <div class="getfish-reason-box">
          <div class="getfish-reason-title">
            <span>⚠️</span> 위험 탐지 사유
          </div>
          <p class="getfish-reason-text">${reasonText}</p>
        </div>

        <div class="getfish-btn-group">
          <button id="getfish-btn-safe-redirect" class="getfish-btn-safe">
            <span>🛡️</span> 안전한 공식 웹사이트로 이동하기
          </button>
          <button id="getfish-btn-close-ignore" class="getfish-btn-ignore">
            위험을 감수하고 닫기 (권장하지 않음)
          </button>
        </div>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    // Prevent scrolling on background
    document.body.style.overflow = 'hidden';

    // Button Event Listeners
    const safeBtn = document.getElementById('getfish-btn-safe-redirect');
    if (safeBtn) {
      safeBtn.onclick = () => {
        window.location.href = redirectUrl;
      };
    }

    const ignoreBtn = document.getElementById('getfish-btn-close-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = '';
        }, 300);
      });
    }
  }

  /**
   * Listen for commands from Background Worker (e.g. manual trigger or async API response)
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_BLOCK_MODAL') {
      if (!isOverlayShown) {
        isOverlayShown = true;
        showPhishingModal(
          message.badgeText || '피싱 사이트 차단됨',
          message.reason || '백엔드 검증 엔진에서 고위험 피싱 사이트로 판정하였습니다.',
          message.redirectUrl || 'https://pay.naver.com'
        );
      }
      sendResponse({ success: true });
    }
  });

  // Run immediately on load
  checkKillSwitch();
  analyzePageMetadata();

  // Watch for dynamic DOM changes (MutationObserver for SPA / dynamic payment forms)
  const observer = new MutationObserver(() => {
    checkKillSwitch();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
