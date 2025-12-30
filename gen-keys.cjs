const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('---START---');
console.log(JSON.stringify(vapidKeys));
console.log('---END---');
