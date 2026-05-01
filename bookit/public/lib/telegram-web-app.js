/**
 * BookIT Telegram WebApp SDK Fallback
 * Initializes ONLY if Telegram launch parameters are present in URL.
 */
(function() {
  const fullUrl = (window.location.hash + window.location.search).toLowerCase();
  const hasTgParams = fullUrl.includes('tgwebappdata=');
  
  if (!hasTgParams) {
    // We are not in Telegram, do nothing and don't pollute window object
    return;
  }

  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    return;
  }
  
  window.Telegram = window.Telegram || {};
  
  const WebApp = {
    initData: '',
    initDataUnsafe: {},
    version: '6.0',
    platform: 'unknown',
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    headerColor: '#ffffff',
    backgroundColor: '#ffffff',
    BackButton: { isVisible: false, onClick: function() {}, offClick: function() {}, show: function() {}, hide: function() {} },
    MainButton: { text: '', color: '', textColor: '', isVisible: false, isActive: false, isProgressVisible: false, onClick: function() {}, offClick: function() {}, show: function() {}, hide: function() {}, enable: function() {}, disable: function() {}, showProgress: function() {}, hideProgress: function() {}, setText: function() {}, setParams: function() {} },
    HapticFeedback: { impactOccurred: function() { return WebApp; }, notificationOccurred: function() { return WebApp; }, selectionChanged: function() { return WebApp; } },
    ready: function() {},
    expand: function() {},
    close: function() { window.close(); },
    requestContact: function(callback) {
      if (callback) callback({ status: 'sent' });
    }
  };

  try {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const rawData = params.get('tgWebAppData') || params.get('TGWEBAPPDATA');
    
    if (rawData) {
      WebApp.initData = rawData;
      const dataParams = new URLSearchParams(rawData);
      const userStr = dataParams.get('user');
      if (userStr) {
        WebApp.initDataUnsafe.user = JSON.parse(userStr);
      }
    }
  } catch (e) {}

  window.Telegram.WebApp = WebApp;
})();
