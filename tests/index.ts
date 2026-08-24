/**
 * Test entry point — `npm test`
 * Imports all regression suites (registration happens at import time), runs them.
 */
import { run } from './runner';
import './pricing.reg.test';
import './unit-price.reg.test';
import './reviews.reg.test';
import './cache.reg.test';
import './coupons.reg.test';
import './cart.reg.test';
import './offer-freshness.reg.test';
import './auth-hardening.reg.test';
import './seo-currency.reg.test';
import './batch3.reg.test';
import './decimal-money.reg.test';

run().then((code) => process.exit(code));

