"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { Locale } from "@/i18n/locales";

/** Language-switch targets for pages whose URL differs per language (translated slugs). */
type Alternates = Partial<Record<Locale, string>> | null;

const AlternatesContext = createContext<{
  alternates: Alternates;
  setAlternates: (value: Alternates) => void;
}>({ alternates: null, setAlternates: () => {} });

export function AlternatesProvider({ children }: { children: ReactNode }) {
  const [alternates, setAlternates] = useState<Alternates>(null);
  return <AlternatesContext value={{ alternates, setAlternates }}>{children}</AlternatesContext>;
}

export function useAlternates() {
  return useContext(AlternatesContext).alternates;
}

/** Rendered by detail pages: tells the language switch where the other language lives. */
export function SetAlternates({ cs, en }: { cs?: string; en?: string }) {
  const { setAlternates } = useContext(AlternatesContext);
  useEffect(() => {
    setAlternates({ cs, en });
    return () => setAlternates(null);
  }, [cs, en, setAlternates]);
  return null;
}
