"use client";

import {
  Files,
  Gauge,
  House,
  LayoutGrid,
  LockKeyhole,
  LogIn,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  LogoutButton,
  type AccountPresentation,
} from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export type NavigationIcon = "home" | "services" | "login" | "dashboard" | "applications";
type NavigationHref = "/" | "/services" | "/login" | "/dashboard" | "/applications";

export type NavigationItem = Readonly<{
  label: string;
  href?: NavigationHref;
  icon: NavigationIcon;
  disabled?: boolean;
  hint?: string;
}>;

type NavigationProps = Readonly<{
  items: readonly NavigationItem[];
  primaryLabel: string;
  mobileLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  account?: AccountPresentation;
}>;

const navigationIcons: Readonly<Record<NavigationIcon, LucideIcon>> = {
  home: House,
  services: LayoutGrid,
  login: LogIn,
  dashboard: Gauge,
  applications: Files,
};

function NavigationEntry({
  item,
  pathname,
  onNavigate,
  mobile = false,
}: Readonly<{
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
}>) {
  const Icon = navigationIcons[item.icon];
  const active = Boolean(
    item.href
      && (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))),
  );
  const login = !mobile && item.href === "/login";
  const className = cn(
    "nav-entry group/nav inline-flex min-h-11 items-center gap-2.5 rounded-control px-3 text-sm font-semibold transition-[color,background-color,border-color] duration-200",
    mobile
      ? "w-full justify-between px-4 text-foreground hover:bg-muted active:bg-secondary"
      : "text-muted-foreground hover:bg-secondary hover:text-primary focus-visible:bg-secondary",
    active && (mobile
      ? "border-l-4 border-primary bg-secondary text-primary"
      : "bg-secondary text-primary"),
    login
      && "ml-1 border border-primary bg-primary px-4 text-primary-foreground! shadow-subtle hover:bg-primary-hover hover:text-primary-foreground!",
  );

  const content = (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <Icon
        className={cn(
          "nav-entry-icon size-4 shrink-0",
          active && "text-primary",
          login && "text-primary-foreground",
        )}
        strokeWidth={2.2}
        aria-hidden="true"
        data-testid={`nav-icon-${item.icon}`}
      />
      <span className="nav-entry-label relative">{item.label}</span>
    </span>
  );

  if (!item.href || item.disabled) {
    return (
      <span className={cn(className, "cursor-not-allowed opacity-65")} aria-disabled="true">
        <span className="inline-flex items-center gap-2.5">
          <LockKeyhole className="size-4" aria-hidden="true" />
          <span>{item.label}</span>
        </span>
        {item.hint ? <span className="text-xs font-medium">{item.hint}</span> : null}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
      onNavigate={onNavigate}
      data-active={active ? "true" : "false"}
      data-variant={login ? "cta" : "default"}
    >
      {content}
    </Link>
  );
}

export function DesktopNavigation({
  items,
  primaryLabel,
}: Pick<NavigationProps, "items" | "primaryLabel">) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label={primaryLabel}>
      {items.map((item) => (
        <NavigationEntry key={`${item.href ?? "disabled"}-${item.label}`} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}

export function MobileNavigation({
  items,
  mobileLabel,
  openMenuLabel,
  closeMenuLabel,
  account,
}: Pick<
  NavigationProps,
  "items" | "mobileLabel" | "openMenuLabel" | "closeMenuLabel" | "account"
>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button
        ref={menuButtonRef}
        variant="ghost"
        size="icon"
        className="border border-border bg-card text-foreground! hover:border-primary/45 hover:bg-secondary hover:text-primary!"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        aria-label={isOpen ? closeMenuLabel : openMenuLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </Button>

      {isOpen ? (
        <div
          id="mobile-navigation-panel"
          className="absolute inset-x-0 top-full border-b border-border bg-card/98 px-4 py-4 text-foreground shadow-elevated backdrop-blur-xl"
        >
          <nav className="mx-auto grid max-w-6xl gap-1" aria-label={mobileLabel}>
            {items.map((item) => (
              <NavigationEntry
                key={`${item.href ?? "disabled"}-${item.label}`}
                item={item}
                pathname={pathname}
                mobile
                onNavigate={() => setIsOpen(false)}
              />
            ))}
            {account ? (
              <div className="mt-2 border-t border-border pt-3">
                <p className="px-4 pb-1 text-xs font-semibold text-muted-foreground">{account.label}</p>
                <LogoutButton presentation={account} className="px-1" />
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
