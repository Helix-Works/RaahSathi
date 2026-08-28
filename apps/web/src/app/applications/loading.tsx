import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ApplicationsLoading() {
  return (
    <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
