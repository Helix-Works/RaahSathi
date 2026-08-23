import { Route } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-primary-foreground/20 bg-primary text-primary-foreground">
      <div className="relative mx-auto flex min-h-16 max-w-[80rem] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-sm font-black tracking-tight"
          aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
        >
          <span
            className="grid size-9 place-items-center border border-primary-foreground/45"
            aria-hidden="true"
          >
            <Route className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="hidden text-lg min-[370px]:inline">{messages.landing.name}</span>
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
          <div className="hidden items-center gap-1 border-l border-primary-foreground/25 pl-2 lg:flex">
            <span className="hidden max-w-36 px-2 text-right text-xs font-bold leading-4 text-primary-foreground/70 xl:block">
              {account.label}
            </span>
            <LogoutButton
              presentation={account}
              buttonClassName="text-primary-foreground! hover:bg-primary-foreground/10 hover:text-primary-foreground!"
            />
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
