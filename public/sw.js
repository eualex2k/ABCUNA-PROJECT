/*
* ABCUNA - Service Worker for Push Notifications
* v2.0.0
*/

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
            console.log('[Service Worker] Push data (JSON):', data);
        } catch (e) {
            data = { message: event.data.text() };
            console.log('[Service Worker] Push data (Text):', data.message);
        }
    }

    const title = data.title || 'ABCUNA';
    const options = {
        body: data.message || data.body || 'Nova notificação recebida',
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: {
            url: data.link || data.url || '/'
        },
        vibrate: [100, 50, 100],
        tag: 'abcuna-notification',
        renotify: true,
        requireInteraction: true // Faz a notificação ficar até o usuário fechar
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[Service Worker] Notification shown successfully'))
            .catch(err => console.error('[Service Worker] ERROR showing notification:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Forçar atualização do SW
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
