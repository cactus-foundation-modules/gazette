import { getSessionFromCookie } from '@/lib/auth/session'
import { resolveExtensionTabs } from '@/lib/modules/extension-tabs'
import GazetteNavTabs from '@/modules/gazette/components/admin/GazetteNavTabs'
import type { GazetteAccess } from '@/modules/gazette/lib/types'

// The tab strip every Gazette admin page opens with. Server-side so it can ask which
// tabs other modules have published into `gazette.admin-tabs` (see the [tab] page);
// a site with none gets exactly the tabs Gazette itself ships.
export default async function GazetteNav({ access }: { access: GazetteAccess }) {
  const user = await getSessionFromCookie()
  const extra = (await resolveExtensionTabs('gazette.admin-tabs', user)).map((t) => ({ id: t.id, label: t.label }))
  return <GazetteNavTabs access={access} extra={extra} />
}
