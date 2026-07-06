/**
 * GetFish Background Service Worker
 * Manages local Whitelist/Blacklist cache, communicates with Python FastAPI backend, and logs statistics
 */

let whitelist = [];
let blacklist = [];
let blockedCount = 0;
let currentStatus = { state: 'SAFE', label: '🟢 안전한 사이트', domain: '' };

// Load Whitelist and Blacklist on startup
async function loadLocalLists() {
  try {
    const wlResponse = await fetch(chrome.runtime.getURL('data/whitelist.json'));
    const wlData = await wlResponse.json();
    whitelist = wlData.whitelist || [];

    const blResponse = await fetch(chrome.runtime.getURL('data/blacklist.json'));
    const blData = await blResponse.json();
    blacklist = blData.blacklist || [];

    // Load stats from storage
    const stored = await chrome.storage.local.get(['blockedCount']);
    if (stored.blockedCount) {
      blockedCount = stored.blockedCount;
    }

    console.log(`[GetFish Background] Loaded ${whitelist.length} whitelist domains, ${blacklist.length} blacklist domains.`);
  } catch (error) {
    console.error('[GetFish Background] Error loading lists:', error);
  }
}

loadLocalLists();

/**
 * Increment blocked counter and update extension badge
 */
function recordPhishingBlock(domain) {
  blockedCount++;
  chrome.storage.local.set({ blockedCount });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  chrome.action.setBadgeText({ text: '🔴' });
  currentStatus = { state: 'DANGER', label: '🔴 피싱 사이트 차단됨', domain };
}

/**
 * Message Handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VERIFY_KILL_SWITCH') {
    const domain = message.domain || (sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : '');
    // If domain matches whitelist (e.g. pay.naver.com, orders.pay.naver.com, gov.kr), DO NOT trigger Kill-Switch!
    if (whitelist.some((w) => domain.endsWith(w))) {
      console.log(`[GetFish Background] Kill-switch keyword "${message.keyword}" found on whitelisted domain (${domain}). Safe pass!`);
      sendResponse({ shouldBlock: false });
    } else {
      sendResponse({ shouldBlock: true });
    }
    return true;
  }

  if (message.type === 'KILL_SWITCH_TRIGGERED') {
    const domain = sender.tab ? new URL(sender.tab.url).hostname : 'unknown';
    console.warn(`[GetFish Background] Kill-Switch triggered on ${domain} (Keyword: ${message.keyword})`);
    recordPhishingBlock(domain);
    sendResponse({ received: true });
    return true;
  }

  if (message.type === 'GET_CURRENT_STATUS') {
    const domain = message.domain || currentStatus.domain || '';
    let state = 'SAFE';
    let label = '🟢 안전한 사이트';
    let title = '안전한 일반 웹사이트';

    if (domain && blacklist.some((b) => domain.includes(b))) {
      state = 'DANGER';
      label = '🔴 피싱 사이트 차단됨';
      title = '피싱 위험 차단됨';
    } else if (domain && whitelist.some((w) => domain.endsWith(w))) {
      state = 'SAFE';
      label = '🟢 안전한 공식 사이트';
      title = '안전한 공식 사이트';
    } else if (currentStatus.domain === domain) {
      state = currentStatus.state;
      label = currentStatus.label;
      title = currentStatus.state === 'DANGER' ? '피싱 위험 차단됨' : '안전한 일반 웹사이트';
    }

    sendResponse({
      status: { state, label, domain, title },
      blockedCount: blockedCount
    });
    return true;
  }

  if (message.type === 'ANALYZE_PAGE') {
    const data = message.data || {};
    const domain = data.domain || '';
    currentStatus = { state: 'SAFE', label: '🟢 안전한 사이트', domain };

    // Step 1: Check Local Whitelist (Ultra-fast pass)
    if (whitelist.some((w) => domain.endsWith(w))) {
      console.log(`[GetFish] ${domain} matches local Whitelist. Safe!`);
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ status: 'SAFE' });
      return true;
    }

    // Step 2: Check Local Blacklist (Immediate block)
    if (blacklist.some((b) => domain.includes(b))) {
      console.warn(`[GetFish] ${domain} matches local Blacklist! Block!`);
      recordPhishingBlock(domain);
      
      let redirectUrl = 'https://pay.naver.com';
      if (domain.includes('toss')) redirectUrl = 'https://toss.im';
      else if (domain.includes('coupang')) redirectUrl = 'https://www.coupang.com';
      else if (domain.includes('kakao')) redirectUrl = 'https://pay.kakao.com';
      else if (domain.includes('inicis')) redirectUrl = 'https://www.inicis.com';

      sendResponse({
        status: 'PHISHING',
        title: '블랙리스트 악성 도메인 감지',
        reason: `현재 접속하신 <strong>${domain}</strong>은(는) 이미 신고·등록된 악성 피싱 사이트입니다.`,
        redirectUrl: redirectUrl
      });
      return true;
    }

    // Step 3 & 4: Call Python FastAPI Backend for Levenshtein Typosquatting & Anomaly Analysis
    currentStatus = { state: 'WARNING', label: '🟡 백엔드 실시간 검증 중', domain };
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    chrome.action.setBadgeText({ text: '🟡' });

    fetch('https://getfish.onrender.com/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .then((apiResult) => {
        if (apiResult.is_phishing) {
          recordPhishingBlock(domain);
          sendResponse({
            status: 'PHISHING',
            title: apiResult.badge_text || '유사 사칭 도메인 감지',
            reason: apiResult.reason || '백엔드 엔진 분석 결과 공식 브랜드를 사칭하는 피싱 사이트로 판별되었습니다.',
            redirectUrl: apiResult.redirect_url || 'https://pay.naver.com'
          });
        } else {
          currentStatus = { state: 'SAFE', label: '🟢 안전한 사이트', domain };
          chrome.action.setBadgeText({ text: '' });
          sendResponse({ status: 'SAFE' });
        }
      })
      .catch((err) => {
        console.log('[GetFish] Backend API offline or error (using fallback local check):', err.message);
        // Fallback: If backend is offline, assume safe unless in blacklist
        currentStatus = { state: 'SAFE', label: '🟢 로컬 검증 완료 (백엔드 오프라인)', domain };
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ status: 'SAFE' });
      });

    return true; // Keep message channel open for async fetch
  }
});
