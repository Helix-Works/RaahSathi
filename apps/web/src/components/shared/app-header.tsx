import Link from "next/link";

import {
  DesktopNavigation,
  MobileNavigation,
  type NavigationItem,
} from "@/components/shared/app-navigation";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import {
  LogoutButton,
  type AccountPresentation,
} from "@/features/auth/components/logout-button";
import type { Locale, MessageDictionary } from "@/i18n";

type AppHeaderProps = Readonly<{
  locale: Locale;
  messages: MessageDictionary;
  navigation: readonly NavigationItem[];
  account?: AccountPresentation;
}>;

export function AppHeader({ locale, messages, navigation, account }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex min-h-18 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl font-black tracking-tight"
          aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
        >
          <span
            className="grid size-9 place-items-center rounded-xl bg-primary text-xs text-primary-foreground"
            aria-hidden="true"
          >
            RS
          </span>
          <span className="hidden text-lg min-[430px]:inline">{messages.landing.name}</span>
        </Link>

        <div className="ml-auto">
          <DesktopNavigation
            items={navigation}
            primaryLabel={messages.navigation.primaryLabel}
          />
        </div>

        <LanguageSwitcher
          locale={locale}
          label={messages.language.label}
          englishLabel={messages.language.english}
          hindiLabel={messages.language.hindi}
        />

        {account ? (
          <div className="hidden items-center gap-1 border-l border-border pl-2 md:flex">
            <span className="hidden max-w-32 truncate px-2 text-xs font-bold text-muted-foreground lg:block">
              {account.label}
            </span>
            <LogoutButton presentation={account} />
          </div>
        ) : null}

        <MobileNavigation
          items={navigation}
          mobileLabel={messages.navigation.mobileLabel}
          openMenuLabel={messages.navigation.openMenu}
          closeMenuLabel={messages.navigation.closeMenu}
          account={account}
        />
      </div>
    </header>
  );
}
