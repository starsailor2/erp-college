import { simulateRequest } from "@/api/http";
import { systemConfig, systemConfigDefaults } from "@/demo-data/system/systemConfig";
import type { SystemConfig } from "@/types";

export function getSystemConfig(): Promise<SystemConfig> {
  return simulateRequest(systemConfig);
}

export function saveSystemConfig(updates: SystemConfig): Promise<SystemConfig> {
  Object.assign(systemConfig, updates);
  return simulateRequest(systemConfig);
}

export function resetSystemConfig(): Promise<SystemConfig> {
  Object.assign(systemConfig, systemConfigDefaults);
  return simulateRequest(systemConfig);
}
