import Link from "next/link";

import { RaahSathiLogo } from "@/components/brand/raahsathi-logo";
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
    <header className="sticky top-0 z-40 border-b border-primary-foreground/15 bg-primary/95 text-primary-foreground shadow-[0_10px_30px_rgba(17,17,15,0.12)] backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-[4.5rem] max-w-[80rem] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="brand-link group/brand flex min-h-11 shrink-0 items-center rounded-xl focus-visible:outline-brand-accent"
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

        <LanguageSwitcher
          locale={locale}
          label={messages.language.label}
          englishLabel={messages.language.english}
          hindiLabel={messages.language.hindi}
        />

        {account ? (
          <div className="hidden items-center gap-1 border-l border-primary-foreground/15 pl-2 lg:flex">
            <span className="hidden max-w-36 px-2 text-right text-xs font-bold leading-4 text-primary-foreground/65 xl:block">
              {account.label}
            </span>
            <LogoutButton
              presentation={account}
              buttonClassName="text-primary-foreground! hover:bg-primary-foreground/10 hover:text-brand-accent!"
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
