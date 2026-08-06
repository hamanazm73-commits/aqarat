"use client";

import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import { LanguageWelcome } from "@/components/language-welcome";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
        <LanguageWelcome />
      </I18nProvider>
    </ThemeProvider>
  );
}
