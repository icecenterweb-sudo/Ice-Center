import 'dotenv/config';
import { revalidateHomepageTag } from '../src/lib/cache/homepage';

async function main() {
    revalidateHomepageTag();
    console.log('Homepage cache purged.');
}

main().catch(console.error);
