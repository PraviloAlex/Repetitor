import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hashPin, loadProgress, redeemPromoCode, setParentSettings } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

export default function ParentPinScreen() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const state = loadProgress();
  const hasPin = Boolean(state.parent.pinHash);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [promo, setPromo] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "ok" | "err">("idle");
  const [premiumUnlocked, setPremiumUnlocked] = useState(Boolean(state.parent.isPremium));
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState<"idle" | "ok" | "err">("idle");
  const defaultPin = "0000";

  useEffect(() => {
    // Simplified family access for pilot: default PIN is always available.
    if (!hasPin) {
      setParentSettings({ pinHash: hashPin(defaultPin) });
    }
  }, [hasPin]);

  function submit() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError(t("pin_err_format"));
      return;
    }
    if (hashPin(pin) === (state.parent.pinHash ?? hashPin(defaultPin))) {
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

  function saveNewPin() {
    if (!/^\d{4}$/.test(newPin)) {
      setPinChangeMsg("err");
      return;
    }
    if (newPin !== newPinConfirm) {
      setPinChangeMsg("err");
      return;
    }
    setParentSettings({ pinHash: hashPin(newPin) });
    setPinChangeMsg("ok");
    setIsEditingPin(false);
    setNewPin("");
    setNewPinConfirm("");
  }

  return (
    <div>
      <h1 className="screen-title">{t("pin_title")}</h1>
      <p className="screen-sub">
        {hasPin
          ? `${t("pin_sub_enter")} ${t("pin_default_note")}`
          : `${t("pin_sub_create")} ${t("pin_default_created_note")}`}
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
        {error && <div className="error-note">{error}</div>}
        <button className="btn" onClick={submit}>
          {t("pin_btn_enter")}
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => {
            setParentSettings({ pinHash: hashPin(defaultPin) });
            setError("");
          }}
        >
          {t("pin_btn_reset_default")}
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => {
            setIsEditingPin((v) => !v);
            setPinChangeMsg("idle");
          }}
        >
          {t("pin_btn_change")}
        </button>

        {isEditingPin && (
          <>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="numeric-input"
              placeholder={t("pin_new_placeholder")}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="numeric-input"
              placeholder={t("pin_new_confirm_placeholder")}
              value={newPinConfirm}
              onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ""))}
            />
            <button className="btn" onClick={saveNewPin}>
              {t("pin_btn_save")}
            </button>
          </>
        )}

        {pinChangeMsg === "ok" && <div className="promo-status promo-status--ok">{t("pin_save_ok")}</div>}
        {pinChangeMsg === "err" && <div className="promo-status promo-status--err">{t("pin_save_err")}</div>}
      </div>

      <button className="btn btn-ghost" onClick={() => navigate("/")}>
        {t("lesson_back")}
      </button>

      <section className={`premium-card${premiumUnlocked ? " premium-card--active" : ""}`}>
        <h2 className="premium-card__title">
          {premiumUnlocked ? t("premium_active_label") : t("premium_locked_title")}
        </h2>
        <p className="premium-card__sub">{premiumUnlocked ? t("premium_promo_ok") : t("premium_locked_sub")}</p>
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
          {t("pin_dev_bypass")}
        </button>
      )}
    </div>
  );
}
