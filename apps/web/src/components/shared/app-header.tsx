import Link from "next/link";

import { RaahSathiLogo } from "@/components/brand/raahsathi-logo";
import {
  DesktopNavigation,
  MobileNavigation,
  type NavigationItem,
} from "@/components/shared/app-navigation";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { PageContainer } from "@/components/shared/page-container";
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
  const primaryNavigation = navigation.filter((item) => item.href !== "/login");
  const loginNavigation = navigation.filter((item) => item.href === "/login");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-primary/10 bg-card/98 text-foreground shadow-[0_1px_7px_rgba(11,47,85,0.06)] backdrop-blur-xl">
      <PageContainer className="relative flex min-h-14 items-center gap-2.5 sm:gap-4">
        <Link
          href="/"
          className="brand-link group/brand flex min-h-11 shrink-0 items-center rounded-control focus-visible:outline-focus"
          data-tone="default"
          aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
        >
          <RaahSathiLogo
            name={messages.landing.name}
            compact
            className="gap-1.5 [&_.brand-mark-shell]:size-8 [&_.brand-wordmark]:text-sm sm:[&_.brand-wordmark]:text-base"
          />
        </Link>

        <div className="ml-3 hidden min-w-0 lg:block xl:ml-8">
          <DesktopNavigation
            items={primaryNavigation}
            primaryLabel={messages.navigation.primaryLabel}
            showIcons={false}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            label={messages.language.label}
            englishLabel={messages.language.english}
            hindiLabel={messages.language.hindi}
          />

          {loginNavigation.length ? (
            <div className="hidden lg:block">
              <DesktopNavigation
                items={loginNavigation}
                primaryLabel={messages.navigation.primaryLabel}
                showIcons={false}
              />
            </div>
          ) : null}

          {account ? (
            <div className="hidden items-center border-l border-border pl-2 lg:flex">
              <LogoutButton
                presentation={account}
                buttonClassName="text-foreground! hover:bg-secondary hover:text-primary!"
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
      </PageContainer>
    </header>
  );
}
