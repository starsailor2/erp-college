import { simulateRequest } from "@/api/http";
import { appSettings, appSettingsDefaults } from "@/demo-data/system/appSettings";
import type { AppSettings } from "@/types";

export function getAppSettings(): Promise<AppSettings> {
  return simulateRequest(appSettings);
}

export function saveAppSettings(updates: AppSettings): Promise<AppSettings> {
  Object.assign(appSettings, updates);
  return simulateRequest(appSettings);
}

export function resetAppSettings(): Promise<AppSettings> {
  Object.assign(appSettings, appSettingsDefaults);
  return simulateRequest(appSettings);
}
