import { CONFIG } from 'src/global-config';

import { CatalogueCalculatorView } from 'src/sections/pricing/view/catalogue-calculator-view';

// ----------------------------------------------------------------------

const metadata = { title: `In Catalogue | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <CatalogueCalculatorView />
        </>
    );
}
