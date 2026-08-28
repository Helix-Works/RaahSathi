import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import type { NavigationItem } from "@/components/shared/app-navigation";
import { ThemeProvider } from "@/components/shared/theme-provider";
import type { AccountPresentation } from "@/features/auth/components/logout-button";
import { getShellSession } from "@/features/auth/session";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  display: "swap",
  variable: "--font-noto-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);

  return {
    title: messages.landing.name,
    description: messages.landing.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await getShellSession();
  const navigation =
    session.kind === "authenticated"
      ? ([
          { href: "/dashboard", label: messages.navigation.dashboard, icon: "dashboard" },
          { href: "/applications", label: messages.navigation.applications, icon: "applications" },
          { href: "/services", label: messages.navigation.services, icon: "services" },
        ] satisfies readonly NavigationItem[])
      : ([
          { href: "/", label: messages.navigation.home, icon: "home" },
          { href: "/services", label: messages.navigation.services, icon: "services" },
          { href: "/login", label: messages.common.logIn, icon: "login" },
        ] satisfies readonly NavigationItem[]);
  const account =
    session.kind === "authenticated"
      ? ({
          label: messages.account.label,
          logoutLabel: messages.account.logout,
          loggingOutLabel: messages.account.loggingOut,
          logoutFailedLabel: messages.account.logoutFailed,
        } satisfies AccountPresentation)
      : undefined;

  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('raahsathi_theme');
        var d = t === 'dark';
        document.documentElement.classList.add(d ? 'dark' : 'light');
      } catch(e) {}
    })()
  `;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={notoSans.variable}>
        <ThemeProvider>
          <AppShell
            locale={locale}
            messages={messages}
            navigation={navigation}
            account={account}
          >
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
