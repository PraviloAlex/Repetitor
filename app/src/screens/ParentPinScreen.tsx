import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hashPin, loadProgress, redeemPromoCode, setParentSettings } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

export default function ParentPinScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const state = loadProgress();
  const hasPin = Boolean(state.parent.pinHash);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [promo, setPromo] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "ok" | "err">("idle");
  const [premiumUnlocked, setPremiumUnlocked] = useState(Boolean(state.parent.isPremium));

  function submit() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError(t("pin_err_format"));
      return;
    }
    if (!hasPin) {
      if (pin !== confirmPin) {
        setError(t("pin_err_mismatch"));
        return;
      }
      setParentSettings({ pinHash: hashPin(pin) });
      navigate("/parent/dashboard");
      return;
    }
    if (hashPin(pin) === state.parent.pinHash) {
      navigate("/parent/dashboard");
    } else {
      setError(t("pin_err_wrong"));
    }
  }

  function applyPromo() {
    const ok = redeemPromoCode(promo);
    setPromoStatus(ok ? "ok" : "err");
    if (ok) setPremiumUnlocked(true);
  }

  return (
    <div>
      <h1 className="screen-title">{t("pin_title")}</h1>
      <p className="screen-sub">
        {hasPin ? t("pin_sub_enter") : t("pin_sub_create")}
      </p>

      <div className="card">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          className="numeric-input"
          placeholder={t("pin_placeholder")}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        {!hasPin && (
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="numeric-input"
            placeholder={t("pin_placeholder_repeat")}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          />
        )}
        {error && <div className="error-note">{error}</div>}
        <button className="btn" onClick={submit}>
          {hasPin ? t("pin_btn_enter") : t("pin_btn_create")}
        </button>
      </div>

      <button className="btn btn-ghost" onClick={() => navigate("/")}>
        {t("lesson_back")}
      </button>

      <section className={`premium-card${premiumUnlocked ? " premium-card--active" : ""}`}>
        <h2 className="premium-card__title">
          {premiumUnlocked ? t("premium_active_label") : t("premium_locked_title")}
        </h2>
        <p className="premium-card__sub">
          {premiumUnlocked ? t("premium_promo_ok") : t("premium_locked_sub")}
        </p>
        {!premiumUnlocked && (
          <>
            <div className="premium-card__label">{t("premium_promo_label")}</div>
            <div className="promo-row">
              <input
                className="numeric-input"
                placeholder={t("premium_promo_placeholder")}
                value={promo}
                onChange={(e) => {
                  setPromo(e.target.value);
                  if (promoStatus !== "idle") setPromoStatus("idle");
                }}
              />
              <button className="btn" onClick={applyPromo}>
                {t("premium_promo_btn")}
              </button>
            </div>
            {promoStatus === "ok" && <div className="promo-status promo-status--ok">{t("premium_promo_ok")}</div>}
            {promoStatus === "err" && <div className="promo-status promo-status--err">{t("premium_promo_err")}</div>}
          </>
        )}
      </section>

      {import.meta.env.DEV && (
        <button
          className="dev-pin-bypass"
          onClick={() => {
            setParentSettings({ pinHash: hashPin("0000"), onboardingDone: true });
            navigate("/parent/dashboard");
          }}
        >
          DEV: войти без PIN (PIN будет "0000")
        </button>
      )}
    </div>
  );
}
