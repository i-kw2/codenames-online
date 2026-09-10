(function (global) {
  'use strict';

  function boot() {
    const CN = global.Codenames;
    if (!CN || !CN.UI || !CN.Game) throw new Error('Codenames modules failed to load in the expected order.');

    // Capture browser errors without making logging a dependency for gameplay.
    // التقاط أخطاء المتصفح دون جعل السجل شرطاً لعمل اللعبة.
    global.addEventListener('error', function (event) {
      CN.Game.logError(event.error || event.message || 'Window error', {
        code: 'WINDOW_ERROR',
        filename: event.filename || null,
        line: event.lineno || null,
        column: event.colno || null
      }, true);
    });

    global.addEventListener('unhandledrejection', function (event) {
      CN.Game.logError(event.reason || 'Unhandled promise rejection', { code: 'UNHANDLED_REJECTION' }, true);
    });

    CN.UI.init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
