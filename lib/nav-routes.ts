/**
 * Primary app routes — used by Navigation and dashboard quick links.
 */
export const MAIN_NAV = [
  { id: "home", label: "Home", href: "/" },
  { id: "sectors", label: "Sectors", href: "/sectors" },
  { id: "calendars", label: "Calendars", href: "/calendars" },
  { id: "heatmaps", label: "Heatmaps", href: "/heatmaps" },
  { id: "screener", label: "Screener", href: "/screener" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
] as const;

export type MainNavId = (typeof MAIN_NAV)[number]["id"];

export function pathnameToNavId(pathname: string): MainNavId | string {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/") return "home";
  const first = normalized.slice(1).split("/")[0];
  if (
    first === "sectors" ||
    first === "calendars" ||
    first === "heatmaps" ||
    first === "screener" ||
    first === "pricing" ||
    first === "profile"
  ) {
    return first;
  }
  return "home";
}
