"use client";

import { PageBanner } from "@/components/layout/page-banner";
import { useLanguage } from "@/lib/i18n/context";
import { DashboardDict } from "@/lib/i18n/dictionary";

type BannerKey = keyof DashboardDict["banners"];

export function TranslatedBanner({
  pageKey,
  image,
  alt,
  dynamicName,
}: {
  pageKey: BannerKey;
  image: string;
  alt: string;
  dynamicName?: string;
}) {
  const { t } = useLanguage();
  const data = t.banners[pageKey];

  let subtitle = "";
  if (pageKey === "driverPortal") {
    const dpData = t.banners.driverPortal;
    subtitle = dynamicName 
      ? dpData.subtitleName.replace("{name}", dynamicName) 
      : dpData.subtitleDefault;
  } else {
    subtitle = (data as { subtitle: string }).subtitle;
  }

  return (
    <PageBanner
      image={image}
      title={data.title}
      subtitle={subtitle}
      alt={alt}
    />
  );
}
