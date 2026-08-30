import https from 'https';
import type { IncomingMessage } from 'http';

console.log('Script started');

const apiKey = process.env.MELIPAYAMAK_API_KEY;
if (!apiKey) {
    console.error('MELIPAYAMAK_API_KEY environment variable is required.');
    process.exit(1);
}

// Use the previously tested number
const data = JSON.stringify({
    'to': '09130027927'
});

const options = {
    hostname: 'console.melipayamak.com',
    port: 443,
    path: `/api/send/otp/${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('Options prepared');

const req = https.request(options, (res: IncomingMessage) => {
    console.log('statusCode: ' + res.statusCode);

    res.on('data', (d: Buffer) => {
        console.log('Data received chunk');
        process.stdout.write(d);
    });

    res.on('end', () => {
        console.log('\nResponse ended');
    });
});

req.on('error', (error: Error) => {
    console.error('Request Error:', error);
});

req.on('socket', () => {
    console.log('Socket assigned');
});

console.log('Writing data...');
req.write(data);
console.log('Ending request...');
req.end();
console.log('Request ended, waiting for response...');

// response willbe like
// {"code":"4999","status":"ارسال موفق بود"}