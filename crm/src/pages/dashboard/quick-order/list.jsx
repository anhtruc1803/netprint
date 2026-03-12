import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const metadata = { title: `In Nhanh Đại Lý | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <div style={{ padding: 32 }}>
                <h2>In Nhanh Đại Lý</h2>
                <p>Trang quản lý đơn in nhanh đại lý đang được phát triển.</p>
            </div>
        </>
    );
}
