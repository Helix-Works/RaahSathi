import { ProtectedRouteLoading } from "@/components/shared/protected-route-loading";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

export default async function ApplicationsLoading() {
  const messages = getDictionary(await getRequestLocale());
  return <ProtectedRouteLoading message={messages.status.loading} />;
}
