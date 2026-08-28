import type { ReactNode } from "react";

import { AppFooter } from "@/components/shared/app-footer";
import { AppHeader } from "@/components/shared/app-header";
import type { NavigationItem } from "@/components/shared/app-navigation";
import type { AccountPresentation } from "@/features/auth/components/logout-button";
import type { Locale, MessageDictionary } from "@/i18n";

type AppShellProps = Readonly<{
  children: ReactNode;
  locale: Locale;
  messages: MessageDictionary;
  navigation: readonly NavigationItem[];
  account?: AccountPresentation;
}>;

export function AppShell({
  children,
  locale,
  messages,
  navigation,
  account,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col pt-14">
      <a className="skip-link" href="#main-content">
        {messages.navigation.skipToContent}
      </a>
      <AppHeader
        locale={locale}
        messages={messages}
        navigation={navigation}
        account={account}
      />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <AppFooter messages={messages} />
    </div>
  );
}
