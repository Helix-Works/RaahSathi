import Link from "next/link";

import { RaahSathiLogo } from "@/components/brand/raahsathi-logo";
import {
  DesktopNavigation,
  MobileNavigation,
  type NavigationItem,
} from "@/components/shared/app-navigation";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { PageContainer } from "@/components/shared/page-container";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 text-foreground shadow-subtle backdrop-blur-xl">
      <PageContainer className="relative flex min-h-[4.5rem] items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="brand-link group/brand flex min-h-11 shrink-0 items-center rounded-control focus-visible:outline-focus"
          data-tone="default"
          aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
        >
          <RaahSathiLogo
            name={messages.landing.name}
            descriptor={messages.navigation.brandDescriptor}
            compact
          />
        </Link>

        <div className="ml-auto min-w-0">
          <DesktopNavigation
            items={navigation}
            primaryLabel={messages.navigation.primaryLabel}
          />
        </div>

        <ThemeToggle
          label={messages.theme.label}
          lightLabel={messages.theme.light}
          darkLabel={messages.theme.dark}
        />

        <LanguageSwitcher
          locale={locale}
          label={messages.language.label}
          englishLabel={messages.language.english}
          hindiLabel={messages.language.hindi}
        />

        {account ? (
          <div className="hidden items-center gap-1 border-l border-border pl-2 lg:flex">
            <span className="hidden max-w-36 px-2 text-right text-xs font-semibold leading-4 text-muted-foreground xl:block">
              {account.label}
            </span>
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
      </PageContainer>
    </header>
  );
}
