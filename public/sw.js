// SW Version: 1.0.4 (Hardened Banner Fix)

// This is the service worker that listens for push notifications
// It must reside in the public/ directory to be accessible

self.addEventListener('install', (event) => {
    console.log('SW: Install event');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activate event');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {
        title: 'New Booking Update 📅',
        body: 'Check your schedule for new client activity.',
        url: '/staff?tab=schedule'
    };

    if (event.data) {
        try {
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const title = data.title;
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-v4.png',
        data: {
            url: data.url
        },
        vibrate: [200, 100, 200],
        tag: data.tag || 'reelin-booking'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;

        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
