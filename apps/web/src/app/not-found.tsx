import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-6xl font-bold text-primary">404</p>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Page not found</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Go to home
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
