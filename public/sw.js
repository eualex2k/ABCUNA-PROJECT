/*
* ABCUNA - Service Worker for Push Notifications
* v2.0.0
*/

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');

    if (!event.data) {
        console.warn('[Service Worker] Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('[Service Worker] Push data received:', data);

        const title = data.title || 'ABCUNA';
        const options = {
            body: data.message || data.body || 'Nova notificação recebida',
            icon: '/logo.svg',
            badge: '/logo.svg',
            data: {
                url: data.link || data.url || '/'
            },
            vibrate: [100, 50, 100],
            actions: [
                { action: 'open', title: 'Abrir Sistema' },
                { action: 'close', title: 'Fechar' }
            ],
            tag: 'abcuna-notification',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => console.log('[Service Worker] Notification shown.'))
                .catch(err => console.error('[Service Worker] Failed to show notification:', err))
        );
    } catch (err) {
        console.error('[Service Worker] Push processing error:', err);
    }
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
