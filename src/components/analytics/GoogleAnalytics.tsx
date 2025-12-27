import { GoogleAnalytics } from '@next/third-parties/google';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-C9MG3EGDGP';

export default function Analytics() {
    return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}

// Export the ID in case it's needed elsewhere
export { GA_MEASUREMENT_ID };
