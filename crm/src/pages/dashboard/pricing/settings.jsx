import { CONFIG } from 'src/global-config';

import { PricingSettingsView } from 'src/sections/pricing/view/pricing-settings-view';

// ----------------------------------------------------------------------

const metadata = { title: `Cài đặt giá | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <PricingSettingsView />
        </>
    );
}
