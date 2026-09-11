"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Language = "en" | "id";

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({
  language: "en",
  setLanguage: () => undefined,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("rairin-language");
    return saved === "id" || saved === "en"
      ? saved
      : navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("rairin-language", language);
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function T({ en, id }: { en: ReactNode; id: ReactNode }) {
  const { language } = useLanguage();
  return <>{language === "id" ? id : en}</>;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label={language === "id" ? "Pilihan bahasa" : "Language selection"}>
      <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} type="button" aria-pressed={language === "en"}>EN</button>
      <button className={language === "id" ? "active" : ""} onClick={() => setLanguage("id")} type="button" aria-pressed={language === "id"}>ID</button>
    </div>
  );
}
