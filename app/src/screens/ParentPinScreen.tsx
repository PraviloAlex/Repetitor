import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hashPin, loadProgress, setParentSettings } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

export default function ParentPinScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const state = loadProgress();
  const hasPin = Boolean(state.parent.pinHash);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

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

      {/* DEV-only bypass: spinned out of production bundle via import.meta.env.DEV */}
      {import.meta.env.DEV && (
        <button
          className="dev-pin-bypass"
          onClick={() => {
            setParentSettings({ pinHash: hashPin("0000"), onboardingDone: true });
            navigate("/parent/dashboard");
          }}
        >
          DEV: войти без PIN (PIN будет «0000»)
        </button>
      )}
    </div>
  );
}
