import { CONFIG } from 'src/global-config';

import { OrderCreateView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tạo đơn hàng | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <OrderCreateView />
        </>
    );
}
