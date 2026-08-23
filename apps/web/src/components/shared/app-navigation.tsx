"use client";

import { LockKeyhole, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  LogoutButton,
  type AccountPresentation,
} from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export type NavigationItem = Readonly<{
  label: string;
  href?: "/" | "/services" | "/login" | "/dashboard" | "/applications";
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
  const className = cn(
    "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors",
    mobile && "w-full justify-between px-4",
    item.href && pathname === item.href
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  if (!item.href || item.disabled) {
    return (
      <span className={cn(className, "cursor-not-allowed opacity-65")} aria-disabled="true">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole className="size-4" aria-hidden="true" />
          {item.label}
        </span>
        {item.hint ? <span className="text-xs font-medium">{item.hint}</span> : null}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={pathname === item.href ? "page" : undefined}
      onNavigate={onNavigate}
    >
      {item.label}
    </Link>
  );
}

export function DesktopNavigation({
  items,
  primaryLabel,
}: Pick<NavigationProps, "items" | "primaryLabel">) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label={primaryLabel}>
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        aria-label={isOpen ? closeMenuLabel : openMenuLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </Button>

      {isOpen ? (
        <div
          id="mobile-navigation-panel"
          className="absolute inset-x-0 top-full border-b border-border bg-card px-4 py-3 shadow-lg"
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
                <p className="px-4 pb-1 text-xs font-bold text-muted-foreground">
                  {account.label}
                </p>
                <LogoutButton presentation={account} className="px-1" />
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
