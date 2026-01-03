/* eslint-disable no-restricted-globals */
// SW Version: 1.0.3 (Force Update)

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
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'New Booking', body: event.data.text() };
    }

    const title = data.title || 'New Booking';
    const options = {
        body: data.body || 'You have a new appointment scheduled.',
        icon: '/icon-192.png',
        badge: '/icon-v4.png', // Small monochrome icon for target bar
        data: {
            url: data.url || '/admin?tab=schedule',
            appointmentId: data.appointmentId
        },
        // Premium behavior: vibration and high-urgency look
        vibrate: [200, 100, 200],
        tag: data.appointmentId || 'new-booking' // Prevents duplicate notifications for same ID
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
