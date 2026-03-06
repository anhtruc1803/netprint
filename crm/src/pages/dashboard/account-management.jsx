import { CONFIG } from 'src/global-config';

import { AccountManagementView } from 'src/sections/account/view/account-management-view';

// ----------------------------------------------------------------------

const metadata = { title: `Quản lý tài khoản - ${CONFIG.appName}` };

export default function AccountManagementPage() {
    return (
        <>
            <title>{metadata.title}</title>

            <AccountManagementView />
        </>
    );
}
