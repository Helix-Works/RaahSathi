"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const themeListeners = new Set<() => void>();

function applyTheme(resolvedTheme: "light" | "dark"): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("raahsathi_theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return "light";
}

function subscribeToStoredTheme(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "raahsathi_theme") onStoreChange();
  };
  themeListeners.add(onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerTheme(): Theme {
  return "light";
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useSyncExternalStore(subscribeToStoredTheme, getStoredTheme, getServerTheme);
  const resolvedTheme = theme;

  useEffect(() => applyTheme(resolvedTheme), [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem("raahsathi_theme", newTheme);
    } catch {
      // localStorage unavailable
    }
    themeListeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light",
      resolvedTheme: "light",
      setTheme: () => {},
    };
  }
  return context;
}
