import { PageContainer } from "@/components/shared/page-container";
import { LoadingState } from "@/components/shared/state-presentations";

export function ProtectedRouteLoading({ message }: Readonly<{ message: string }>) {
  return (
    <PageContainer className="space-y-6 py-10 sm:py-12 lg:py-14">
      <LoadingState message={message} />
    </PageContainer>
  );
}
