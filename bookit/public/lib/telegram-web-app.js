/**
 * BookIT Telegram WebApp SDK Fallback
 * Initializes ONLY if Telegram launch parameters are present in URL.
 */
(function() {
  const fullUrl = (window.location.hash + window.location.search).toLowerCase();
  const hasTgParams = fullUrl.includes('tgwebappdata=');
  
  if (!hasTgParams) {
    return;
  }

  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData && window.Telegram.WebApp.openLink) {
    console.log('Telegram SDK already loaded with full methods');
    return;
  }
  
  window.Telegram = window.Telegram || {};
  
  const WebApp = window.Telegram.WebApp || {};
  
  // Basic properties
  WebApp.initData = WebApp.initData || '';
  WebApp.initDataUnsafe = WebApp.initDataUnsafe || {};
  WebApp.version = WebApp.version || '6.1';
  WebApp.platform = WebApp.platform || 'unknown';
  WebApp.isExpanded = true;
  WebApp.viewportHeight = window.innerHeight;
  WebApp.viewportStableHeight = window.innerHeight;
  
  // Stubs for UI components
  WebApp.BackButton = WebApp.BackButton || { isVisible: false, onClick: function() {}, offClick: function() {}, show: function() {}, hide: function() {} };
  WebApp.MainButton = WebApp.MainButton || { text: '', color: '', textColor: '', isVisible: false, isActive: false, isProgressVisible: false, onClick: function() {}, offClick: function() {}, show: function() {}, hide: function() {}, enable: function() {}, disable: function() {}, showProgress: function() {}, hideProgress: function() {}, setText: function() {}, setParams: function() {} };
  WebApp.HapticFeedback = WebApp.HapticFeedback || { impactOccurred: function() { return WebApp; }, notificationOccurred: function() { return WebApp; }, selectionChanged: function() { return WebApp; } };
  
  // Core methods
  WebApp.ready = WebApp.ready || function() {};
  WebApp.expand = WebApp.expand || function() {};
  WebApp.close = WebApp.close || function() { window.close(); };
  
  // Linking methods (Fixing the undefined error)
  WebApp.openLink = WebApp.openLink || function(url, options) {
    console.log('Fallback openLink:', url);
    window.open(url, '_blank');
  };
  
  WebApp.openTelegramLink = WebApp.openTelegramLink || function(url) {
    console.log('Fallback openTelegramLink:', url);
    window.open(url, '_blank');
  };
  
  WebApp.requestContact = WebApp.requestContact || function(callback) {
    if (callback) callback({ status: 'sent' });
  };

  // Parse initData
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
