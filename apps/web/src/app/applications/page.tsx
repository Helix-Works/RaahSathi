import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getRequestLocale } from "@/i18n/locale";
import { listApplications } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

export default async function ApplicationsPage() {
  const locale = await getRequestLocale();
  const session = await resolveSessionFromCookie((await cookies()).toString());
  if (session.kind !== "authenticated") redirect("/login?returnTo=/applications");
  const applications = await listApplications(session.context);
  const hindi = locale === "hi";
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6"><h1 className="text-3xl font-black">{hindi ? "आपके आवेदन" : "Your applications"}</h1>{applications.length === 0 ? <p>{hindi ? "अभी कोई आवेदन नहीं है।" : "No applications yet."}</p> : applications.map((application) => <Card key={application.id}><CardHeader><h2 className="text-xl font-black">{application.serviceKey.replaceAll("_", " ")}</h2></CardHeader><CardContent className="flex items-center justify-between gap-4"><span>{application.progressPercent}%</span><Link className="font-bold text-primary underline" href={`/applications/${application.id}`}>{hindi ? "जारी रखें" : "Resume"}</Link></CardContent></Card>)}</div>;
}
