import { useLocation, useNavigate } from "react-router-dom";
import LangSwitch from "./LangSwitch";
import { loadProgress, getOverdueReviewIds } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";
import { APP_BUILD_VERSION } from "../buildMeta";

type TopNavItem = {
  path: string;
  labelKey: "nav_home" | "nav_topics" | "nav_review" | "nav_parent";
};

const TOP_NAV: TopNavItem[] = [
  { path: "/", labelKey: "nav_home" },
  { path: "/topics", labelKey: "nav_topics" },
  { path: "/review", labelKey: "nav_review" },
  { path: "/parent", labelKey: "nav_parent" },
];

const HIDDEN_NAV_ON = ["/lesson", "/summary", "/onboarding", "/privacy"];

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const reviewCount = getOverdueReviewIds(loadProgress()).length;
  const showDesktopNav = !HIDDEN_NAV_ON.some((prefix) => location.pathname.startsWith(prefix));

  function isActive(item: TopNavItem) {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  }

  return (
    <div className="top-bar">
      <button className="top-bar__brand" onClick={() => navigate("/")}>
        Durillo <span style={{ fontSize: 12, opacity: 0.72, marginLeft: 6 }}>v{APP_BUILD_VERSION}</span>
      </button>

      {showDesktopNav && (
        <nav className="top-nav" aria-label="Main navigation">
          {TOP_NAV.map((item) => {
            const active = isActive(item);
            const isReview = item.path === "/review";
            return (
              <button
                key={item.path}
                className={`top-nav__item${active ? " is-active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {t(item.labelKey)}
                {isReview && reviewCount > 0 && (
                  <span className="top-nav__badge">{reviewCount > 99 ? "99+" : reviewCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      <LangSwitch variant="compact" />
    </div>
  );
}
