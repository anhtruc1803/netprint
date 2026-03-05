import { CONFIG } from 'src/global-config';

import { PricingCalculatorView } from 'src/sections/pricing/view/pricing-calculator-view';

// ----------------------------------------------------------------------

const metadata = { title: `Tính giá in | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <PricingCalculatorView />
        </>
    );
}
