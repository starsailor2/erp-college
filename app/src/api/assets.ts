import { simulateRequest } from "@/api/http";
import { assets, getAssetById } from "@/demo-data/campus/assets";
import type { Asset } from "@/types";

export function getAssets(): Promise<Asset[]> {
  return simulateRequest(assets);
}

export function getAssetByIdAsync(id: string): Promise<Asset | undefined> {
  return simulateRequest(getAssetById(id));
}

export function addAsset(entry: Asset): Promise<Asset> {
  assets.unshift(entry);
  return simulateRequest(entry);
}

export function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
  const idx = assets.findIndex((a) => a.id === id);
  if (idx !== -1) assets[idx] = { ...assets[idx], ...updates };
  return simulateRequest(assets[idx]);
}
