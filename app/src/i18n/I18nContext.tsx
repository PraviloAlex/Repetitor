import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { STRINGS } from "./strings";
import type { StringKey } from "./strings";
import type { Language, LocalizedText } from "./types";
import { loadProgress, setParentSettings } from "../storage/localProgress";

type Vars = Record<string, string | number>;

// Russian pluralization helper: 1 vopros / 2 voprosa / 5 voprosov
export function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

type I18nValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: StringKey, vars?: Vars) => string;
  pick: (text: LocalizedText | undefined) => string;
  pluralCount: (count: number, one: string, few: string, many: string) => string;
};

const Ctx = createContext<I18nValue | null>(null);

const HTML_LANG: Record<Language, string> = {
  ru: "ru",
  es: "es-AR"
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return loadProgress().parent.language ?? "ru";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = HTML_LANG[lang];
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setParentSettings({ language: l });
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: StringKey, vars?: Vars): string => {
      const table = STRINGS[lang] as Record<string, string>;
      let str = table[key] ?? (STRINGS.ru as Record<string, string>)[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const pick = useCallback(
    (text: LocalizedText | undefined): string => {
      if (!text) return "";
      return text[lang] ?? text.es ?? text.ru ?? "";
    },
    [lang]
  );

  const pluralCount = useCallback(
    (count: number, one: string, few: string, many: string): string => {
      if (lang === "ru") return pluralRu(count, one, few, many);
      return count === 1 ? one : many;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t, pick, pluralCount }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within I18nProvider");
  return v;
}
