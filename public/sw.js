/*
* ABCUNA - Service Worker for Push Notifications
*/

self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.message || data.body,
            icon: '/icon.png', // Opcional, se existir
            badge: '/badge.png',
            data: {
                url: data.link || data.url || '/'
            },
            vibrate: [100, 50, 100],
            actions: [
                { action: 'open', title: 'Abrir Sistema' },
                { action: 'close', title: 'Fechar' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'ABCUNA', options)
        );
    } catch (err) {
        console.error('Push handling error:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = event.notification.data.url;

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
