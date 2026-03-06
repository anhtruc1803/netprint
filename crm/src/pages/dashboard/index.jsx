import { CONFIG } from 'src/global-config';

import { WorkplaceView } from 'src/sections/workplace/view/workplace-view';

// ----------------------------------------------------------------------

const metadata = { title: `Workplace - ${CONFIG.appName}` };

export default function WorkplacePage() {
  return (
    <>
      <title>{metadata.title}</title>

      <WorkplaceView />
    </>
  );
}
