import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-presentations";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

export default async function ServicesLoading() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);

  return (
    <div className="mx-auto max-w-[80rem] space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow={messages.services.eyebrow}
        title={messages.services.title}
        description={messages.services.description}
      />
      <LoadingState message={messages.services.loading} />
    </div>
  );
}
