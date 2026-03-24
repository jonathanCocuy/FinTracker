'use client';

import { useI18n } from "@/src/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return <div className="text-3xl font-bold">{t("home.hello")}</div>;
}