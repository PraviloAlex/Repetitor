import { useLocation, useNavigate } from "react-router-dom";
import LangSwitch from "./LangSwitch";
import Icon from "./Icon";
import { HIDDEN_NAV_ON, NAV_ITEMS, isNavActive } from "./navItems";
import { loadProgress, getOverdueReviewIds } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

export default function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const reviewCount = getOverdueReviewIds(loadProgress()).length;

  if (HIDDEN_NAV_ON.some((prefix) => location.pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <aside className="desktop-sidebar" aria-label="Main navigation">
      <button className="desktop-sidebar__brand" onClick={() => navigate("/")}>
        Durillo
      </button>

      <nav className="desktop-sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(location.pathname, item);
          const isReview = item.path === "/review";
          return (
            <button
              key={`${item.labelKey}-${item.path}`}
              className={`desktop-sidebar__item${active ? " is-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} size={19} />
              <span>{t(item.labelKey)}</span>
              {isReview && reviewCount > 0 && (
                <span className="desktop-sidebar__badge">{reviewCount > 99 ? "99+" : reviewCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="desktop-sidebar__footer">
        <span className="desktop-sidebar__footer-label">{t("lang_label")}</span>
        <LangSwitch variant="compact" />
      </div>
    </aside>
  );
}
