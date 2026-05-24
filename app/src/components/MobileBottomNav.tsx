import { useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { HIDDEN_NAV_ON, NAV_ITEMS, isNavActive } from "./navItems";
import { loadProgress, getOverdueReviewIds } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  if (HIDDEN_NAV_ON.some((prefix) => location.pathname.startsWith(prefix))) {
    return null;
  }

  const reviewCount = getOverdueReviewIds(loadProgress()).length;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.filter((item) => item.mobile).map((item) => {
        const active = isNavActive(location.pathname, item);
        const isReview = item.path === "/review";
        return (
          <button
            key={`${item.labelKey}-${item.path}`}
            className={`bottom-nav__item${active ? " is-active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="bottom-nav__icon">
              <Icon name={item.icon} size={22} />
              {isReview && reviewCount > 0 && (
                <span className="bottom-nav__badge">
                  {reviewCount > 99 ? "99+" : reviewCount}
                </span>
              )}
            </span>
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
