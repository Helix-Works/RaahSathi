import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-11 w-40" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
