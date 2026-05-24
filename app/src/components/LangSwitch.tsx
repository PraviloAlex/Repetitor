import { useI18n } from "../i18n/I18nContext";

type Props = {
  variant?: "inline" | "compact";
};

export default function LangSwitch({ variant = "inline" }: Props) {
  const { lang, setLang, t } = useI18n();

  if (variant === "compact") {
    return (
      <div
        style={{
          display: "inline-flex",
          gap: 6,
          alignItems: "center",
          fontSize: 13
        }}
      >
        <button
          className="lang-btn"
          aria-pressed={lang === "ru"}
          onClick={() => setLang("ru")}
        >
          {t("lang_ru")}
        </button>
        <span style={{ color: "var(--text-soft)" }}>·</span>
        <button
          className="lang-btn"
          aria-pressed={lang === "es"}
          onClick={() => setLang("es")}
        >
          {t("lang_es")}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span className="muted">{t("lang_label")}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="lang-btn"
          aria-pressed={lang === "ru"}
          onClick={() => setLang("ru")}
        >
          {t("lang_ru")}
        </button>
        <button
          className="lang-btn"
          aria-pressed={lang === "es"}
          onClick={() => setLang("es")}
        >
          {t("lang_es")}
        </button>
      </div>
    </div>
  );
}
