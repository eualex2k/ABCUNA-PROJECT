const { generateKeyPairSync } = require('crypto');

const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
});

// use jwk export
const jwk = privateKey.export({ format: 'jwk' });

// Node Buffer supports base64url encoding directly
const x = Buffer.from(jwk.x, 'base64');
const y = Buffer.from(jwk.y, 'base64');

// Uncompressed point: 0x04 + x + y
const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y]);
const pubString = uncompressed.toString('base64url');
const privString = Buffer.from(jwk.d, 'base64').toString('base64url');

console.log('NEW_PUBLIC_KEY=' + pubString);
console.log('NEW_PRIVATE_KEY=' + privString);
