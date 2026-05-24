import type { IconName } from "./Icon";

export type NavLabelKey =
  | "nav_today"
  | "nav_topics"
  | "nav_review"
  | "nav_academy"
  | "nav_skills"
  | "nav_progress"
  | "nav_parent";

export type NavItem = {
  path: string;
  icon: IconName;
  labelKey: NavLabelKey;
  mobile?: boolean;
};

export const HIDDEN_NAV_ON = ["/lesson", "/summary", "/onboarding", "/privacy"];

export const NAV_ITEMS: NavItem[] = [
  { path: "/", icon: "today", labelKey: "nav_today", mobile: true },
  { path: "/topics", icon: "topics", labelKey: "nav_topics", mobile: true },
  { path: "/progress", icon: "progress", labelKey: "nav_progress", mobile: true },
  { path: "/academy", icon: "academy", labelKey: "nav_academy", mobile: true },
  { path: "/review", icon: "review", labelKey: "nav_review", mobile: true },
  { path: "/skills", icon: "skills", labelKey: "nav_skills" },
  { path: "/parent", icon: "parent", labelKey: "nav_parent", mobile: true },
];

export function isNavActive(pathname: string, item: NavItem) {
  if (item.path === "/") return pathname === "/";
  if (item.labelKey === "nav_progress") return pathname.startsWith("/progress");
  if (item.labelKey === "nav_parent") {
    return pathname.startsWith("/parent") && !pathname.startsWith("/parent/dashboard");
  }
  return pathname.startsWith(item.path);
}
