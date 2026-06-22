"use client";
import { ProtectedRoute } from "@/components/layout";
import { SettingsPage } from "@/components/settings/settings-page";

export default function Settings() {
  return <ProtectedRoute permission="configureModel"><SettingsPage /></ProtectedRoute>;
}
