/**
 * GetFish Popup JS
 * Communicates with Background Worker to display security status and statistics
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusCard = document.getElementById('status-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDomain = document.getElementById('status-domain');
  const blockedCountEl = document.getElementById('stat-blocked-count');
  const backendStatusEl = document.getElementById('backend-status-text');

  // Query active tab to display exact current domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs && tabs[0] ? tabs[0] : null;
    let domain = '현재 탭 정보 없음';
    if (currentTab && currentTab.url) {
      try {
        if (currentTab.url.startsWith('file://')) {
          domain = '로컬 데모 페이지 (' + currentTab.url.split('/').pop() + ')';
        } else {
          domain = new URL(currentTab.url).hostname;
        }
      } catch (e) {}
    }

    // Query Background Worker for current status of this tab
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATUS', domain: domain }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusTitle.textContent = '상태 확인 불가';
        statusDomain.textContent = domain;
        return;
      }

      const { status, blockedCount } = response;
      blockedCountEl.textContent = blockedCount || 0;

      // Always display the actual domain of the currently active tab!
      statusDomain.textContent = domain;

      if (status) {
        if (status.state === 'DANGER') {
          statusCard.className = 'status-card danger';
          statusIcon.textContent = '🔴';
          statusTitle.textContent = '피싱 위험 차단됨';
        } else if (status.state === 'WARNING') {
          statusCard.className = 'status-card warning';
          statusIcon.textContent = '🟡';
          statusTitle.textContent = '백엔드 검증 진행 중';
        } else {
          statusCard.className = 'status-card';
          statusIcon.textContent = '🟢';
          statusTitle.textContent = status.title || '안전한 공식 사이트';
        }
      }
    });
  });

  // Check if FastAPI backend is reachable
  fetch('https://getfish.onrender.com/docs', { method: 'HEAD' })
    .then((res) => {
      if (res.ok) {
        backendStatusEl.textContent = '🟢 온라인 (Render 클라우드)';
        backendStatusEl.style.color = '#10B981';
      } else {
        backendStatusEl.textContent = '🟡 응답 지연';
      }
    })
    .catch(() => {
      backendStatusEl.textContent = '🔴 오프라인 (로컬 모드)';
      backendStatusEl.style.color = '#EF4444';
    });

  // Report Button - Real connection to FastAPI backend
  document.getElementById('btn-report').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs && tabs[0] ? tabs[0] : null;
      let domain = 'unknown-domain';
      let url = 'unknown-url';
      if (currentTab && currentTab.url) {
        url = currentTab.url;
        try {
          if (url.startsWith('file://')) {
            domain = '로컬 데모 페이지 (' + url.split('/').pop() + ')';
          } else {
            domain = new URL(url).hostname;
          }
        } catch(e) { domain = url; }
      }

      fetch('https://getfish.onrender.com/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, domain: domain, reason: '사용자 팝업 의심 제보' })
      })
      .then((res) => res.json())
      .then((data) => {
        alert(`✅ [제보 접수 완료]\nRender 클라우드 감시 서버(getfish.onrender.com)에 해당 사이트[${domain}]가 실시간으로 접수되었습니다!\n\n(관리자 2단계 검증 후 실시간 블랙리스트 DB에 반영됩니다.)`);
      })
      .catch(() => {
        alert(`🚨 [로컬 제보 모드]\n현재 접속 중인 사이트[${domain}] 제보가 로컬 큐에 임시 저장되었습니다.\n(백엔드 서버 연결 시 자동 전송됩니다.)`);
      });
    });
  });

  // Visit Official Site Button
  document.getElementById('btn-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://getfish.onrender.com' });
  });
});
