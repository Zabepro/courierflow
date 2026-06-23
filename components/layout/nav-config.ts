import {
  IconLayoutDashboard, IconPackage, IconUsers,
  IconSettings, IconTruck, IconMap2,
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
];

export const PORTAL_NAV: NavEntry[] = [
  { href: "/dashboard/driver",     label: "Driver Portal", icon: IconTruck,        exact: false },
];

export const BOTTOM_NAV: NavEntry[] = [
  { href: "/dashboard/settings",   label: "Settings",   icon: IconSettings,        exact: false },
];
