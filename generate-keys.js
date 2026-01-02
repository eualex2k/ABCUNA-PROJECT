const { generateKeyPairSync } = require('crypto');

const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
});

const pub = publicKey.export({ type: 'spki', format: 'der' });
// VAPID public key is the raw 65 bytes of the uncompressed point.
// spki DER contains metadata. We need to extract the last 65 bytes for P-256 usually, or parse it properly.
// easier: use 'jwk' export.
const jwk = privateKey.export({ format: 'jwk' });

function toB64Url(str) {
    return Buffer.from(str, 'base64').toString('base64url');
}

// Convert buffers to base64url
const x = Buffer.from(jwk.x, 'base64');
const y = Buffer.from(jwk.y, 'base64');

// Uncompressed point: 0x04 + x + y
const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y]);
const pubString = uncompressed.toString('base64url');
const privString = Buffer.from(jwk.d, 'base64').toString('base64url');

console.log('NEW_PUBLIC_KEY=' + pubString);
console.log('NEW_PRIVATE_KEY=' + privString);
