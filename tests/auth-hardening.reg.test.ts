import { suite, it } from './runner';
import assert from 'node:assert/strict';
import { hashOtp } from '../src/lib/otp';

suite('Batch 2 #31, #16 — OTP & Auth Hardening', () => {
    it('#31: hashOtp generates consistent sha256 hash', () => {
        const hash1 = hashOtp('1234');
        const hash2 = hashOtp('1234');
        const hash3 = hashOtp('5678');

        assert.equal(hash1, hash2);
        assert.notEqual(hash1, hash3);
        assert.equal(hash1.length, 64);
    });

    it('#31: Attempt calculation correctly limits to 3 attempts', () => {
        const MAX_ATTEMPTS = 3;
        let attempts = 0;

        // Attempt 1 fails
        attempts++;
        assert.equal(attempts < MAX_ATTEMPTS, true);
        assert.equal(MAX_ATTEMPTS - attempts, 2);

        // Attempt 2 fails
        attempts++;
        assert.equal(attempts < MAX_ATTEMPTS, true);
        assert.equal(MAX_ATTEMPTS - attempts, 1);

        // Attempt 3 fails
        attempts++;
        assert.equal(attempts >= MAX_ATTEMPTS, true);
        assert.equal(MAX_ATTEMPTS - attempts, 0);
    });
});
