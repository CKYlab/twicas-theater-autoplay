// ==UserScript==
// @name         TwitCasting YouTubeシアパ 自動再生
// @namespace    https://github.com/CKYlab/
// @version      1.0.0
// @description  PC版ツイキャスのYouTubeシアターパーティを自動で再生します。
// @match        https://twitcasting.tv/*
// @run-at       document-idle
// @grant        none
// @license      マボロシ工房 共通利用規約 v1.0
// ==/UserScript==

(() => {
  'use strict';

  const GUIDE_ID = 'tw_theater_party_youtube_guide';
  const IFRAME_SELECTOR =
    'iframe.tw-theater-party__inner[src*="youtube.com/embed/"]';

  const RETRY_INTERVAL_MS = 500;
  const MAX_RETRIES = 8;

  let currentIframe = null;
  let retryTimer = null;
  let retryCount = 0;

  function stopRetry() {
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function resetState() {
    stopRetry();
    currentIframe = null;
    retryCount = 0;
  }

  function isWaitingForUserAction() {
    return document.getElementById(GUIDE_ID) !== null;
  }

  function scheduleRetry(iframe) {
    stopRetry();
    retryTimer = setTimeout(
      () => sendPlayCommand(iframe),
      RETRY_INTERVAL_MS
    );
  }

  function sendPlayCommand(iframe) {
    if (
      iframe !== currentIframe ||
      !document.contains(iframe) ||
      !isWaitingForUserAction()
    ) {
      stopRetry();
      return;
    }

    if (!iframe.contentWindow) {
      scheduleRetry(iframe);
      return;
    }

    try {
      const targetOrigin = new URL(iframe.src, location.href).origin;

      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }),
        targetOrigin
      );
    } catch (error) {
      console.warn('[Twicas Theater AutoPlay] playVideo送信失敗:', error);
    }

    retryCount += 1;

    if (retryCount < MAX_RETRIES && isWaitingForUserAction()) {
      scheduleRetry(iframe);
    } else {
      stopRetry();
    }
  }

  function detectTheaterParty() {
    const guide = document.getElementById(GUIDE_ID);
    const iframe = document.querySelector(IFRAME_SELECTOR);

    if (!guide || !iframe) {
      if (currentIframe && (!iframe || !document.contains(currentIframe))) {
        resetState();
      } else if (!guide) {
        stopRetry();
      }
      return;
    }

    if (iframe === currentIframe) {
      return;
    }

    stopRetry();
    currentIframe = iframe;
    retryCount = 0;

    retryTimer = setTimeout(
      () => sendPlayCommand(iframe),
      800
    );
  }

  const observer = new MutationObserver(detectTheaterParty);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'src']
  });

  detectTheaterParty();
})();
