const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('--- VAPID KEYS GENERATED ---');
console.log('PUBLIC_KEY:', vapidKeys.publicKey);
console.log('PRIVATE_KEY:', vapidKeys.privateKey);
console.log('-----------------------------');
