import { getDb } from "../db";
import { modelConfigs } from "../db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt, maskApiKey } from "./encryption";
import type { ModelConfig } from "../agents";

export function saveModelConfig(userId: string, config: {
  enabled: boolean;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}) {
  const db = getDb();
  const encryptedKey = config.apiKey ? encrypt(config.apiKey) : "";

  const existing = db.select().from(modelConfigs).where(eq(modelConfigs.userId, userId)).get();
  if (existing) {
    db.update(modelConfigs).set({
      enabled: config.enabled,
      providerName: config.providerName,
      baseUrl: config.baseUrl,
      model: config.model,
      apiKeyEncrypted: encryptedKey,
      updatedAt: new Date().toISOString(),
    }).where(eq(modelConfigs.userId, userId)).run();
  } else {
    db.insert(modelConfigs).values({
      userId,
      enabled: config.enabled,
      providerName: config.providerName,
      baseUrl: config.baseUrl,
      model: config.model,
      apiKeyEncrypted: encryptedKey,
    }).run();
  }

  return getModelConfig(userId);
}

export function getModelConfig(userId: string): {
  enabled: boolean;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKeyMasked: string;
  hasKey: boolean;
} | null {
  const db = getDb();
  const config = db.select().from(modelConfigs).where(eq(modelConfigs.userId, userId)).get();
  if (!config) return null;

  const rawKey = decrypt(config.apiKeyEncrypted);
  return {
    enabled: config.enabled,
    providerName: config.providerName,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKeyMasked: maskApiKey(rawKey),
    hasKey: !!rawKey,
  };
}

export async function getDecryptedModelConfig(userId: string): Promise<ModelConfig | null> {
  const db = getDb();
  const config = db.select().from(modelConfigs).where(eq(modelConfigs.userId, userId)).get();
  if (!config || !config.enabled) return null;

  const apiKey = decrypt(config.apiKeyEncrypted);
  if (!apiKey) return null;

  return {
    enabled: config.enabled,
    providerName: config.providerName,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey,
  };
}
