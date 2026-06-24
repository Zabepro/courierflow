import {
  IconLayoutDashboard, IconPackage, IconUsers,
  IconSettings, IconTruck, IconMap2, IconReportAnalytics,
} from "@tabler/icons-react";
import { DashboardDict } from "@/lib/i18n/dictionary";

export type NavEntry = {
  href:  string;
  label: string;
  icon:  React.ElementType;
  exact: boolean;
};

export type NavSection = { label?: string; items: NavEntry[] };

export function navForRole(role: string, t: DashboardDict): { main: NavSection[]; bottom: NavEntry[] } {
  const NAV: NavEntry[] = [
    { href: "/dashboard",            label: t.nav.overview,   icon: IconLayoutDashboard, exact: true  },
    { href: "/dashboard/deliveries", label: t.nav.deliveries, icon: IconPackage,         exact: false },
    { href: "/dashboard/drivers",    label: t.nav.drivers,    icon: IconUsers,           exact: false },
    { href: "/dashboard/map",        label: t.nav.fleetMap,   icon: IconMap2,            exact: false },
    { href: "/dashboard/reports",    label: t.nav.reports,    icon: IconReportAnalytics, exact: false },
  ];

  const PORTAL_NAV: NavEntry[] = [
    { href: "/dashboard/driver",     label: t.nav.driverPortal, icon: IconTruck,        exact: false },
  ];

  const BOTTOM_NAV: NavEntry[] = [
    { href: "/dashboard/settings",   label: t.nav.settings,   icon: IconSettings,        exact: false },
  ];

  if (role === "DRIVER") {
    return {
      main: [
        { items: [
          { href: "/dashboard/driver", label: t.nav.driverPortal, icon: IconTruck, exact: false },
        ] },
      ],
      bottom: [],
    };
  }

  return {
    main: [
      { items: NAV },
      { label: t.nav.portals, items: PORTAL_NAV },
    ],
    bottom: BOTTOM_NAV,
  };
}
