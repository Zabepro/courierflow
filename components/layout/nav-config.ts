import {
  IconLayoutDashboard, IconPackage, IconUsers,
  IconSettings, IconTruck, IconMap2, IconReportAnalytics,
} from "@tabler/icons-react";

export type NavEntry = {
  href:  string;
  label: string;
  icon:  React.ElementType;
  exact: boolean;
};

export const NAV: NavEntry[] = [
  { href: "/dashboard",            label: "Overview",   icon: IconLayoutDashboard, exact: true  },
  { href: "/dashboard/deliveries", label: "Deliveries", icon: IconPackage,         exact: false },
  { href: "/dashboard/drivers",    label: "Drivers",    icon: IconUsers,           exact: false },
  { href: "/dashboard/map",        label: "Fleet Map",  icon: IconMap2,            exact: false },
  { href: "/dashboard/reports",    label: "Reports",    icon: IconReportAnalytics, exact: false },
];

export const PORTAL_NAV: NavEntry[] = [
  { href: "/dashboard/driver",     label: "Driver Portal", icon: IconTruck,        exact: false },
];

export const BOTTOM_NAV: NavEntry[] = [
  { href: "/dashboard/settings",   label: "Settings",   icon: IconSettings,        exact: false },
];

export type NavSection = { label?: string; items: NavEntry[] };

/**
 * Navigation shown to each role. Drivers get a focused portal — just their
 * deliveries — and never see admin/management pages. Admins & viewers get the
 * full management nav plus the driver portal (for testing) and settings.
 */
export function navForRole(role: string): { main: NavSection[]; bottom: NavEntry[] } {
  if (role === "DRIVER") {
    return {
      main: [
        { items: [
          { href: "/dashboard/driver", label: "My Deliveries", icon: IconTruck, exact: false },
        ] },
      ],
      bottom: [],
    };
  }

  return {
    main: [
      { items: NAV },
      { label: "Portals", items: PORTAL_NAV },
    ],
    bottom: BOTTOM_NAV,
  };
}
