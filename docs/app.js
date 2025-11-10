// app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        // Optional: listen for updates
        if (reg.waiting) notifyUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (sw) {
            sw.addEventListener('statechange', () => {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdate(sw); // show “New version available” UI; on confirm: sw.postMessage({ type: 'SKIP_WAITING' })
              }
            });
          }
        });
      })
      .catch(console.error);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Reload to activate the new SW version after SKIP_WAITING
    window.location.reload();
  });
}

function notifyUpdate(sw) {
  // Minimal example; replace with a real toast/dialog
  if (confirm('An update is available. Reload now?')) {
    sw.postMessage({ type: 'SKIP_WAITING' });
  }
}
