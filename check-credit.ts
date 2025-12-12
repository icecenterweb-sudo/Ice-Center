import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const username = process.env.MELIPAYAMAK_USERNAME;
const password = process.env.MELIPAYAMAK_PASSWORD;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MelipayamakApi = require('melipayamak');

async function checkCredit() {
    if (!username || !password) {
        console.error('Error: MELIPAYAMAK_USERNAME or MELIPAYAMAK_PASSWORD not found in environment variables.');
        return;
    }

    try {
        const api = new MelipayamakApi(username, password);
        const sms = api.sms();

        console.log('Checking credit...');

        // MD: smsRest.getCredit();
        await sms.getCredit()
            .then((res: any) => {
                console.log('Current Credit:', res);
            })
            .catch((err: any) => {
                console.error('Error checking credit:', err);
            });

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkCredit();
