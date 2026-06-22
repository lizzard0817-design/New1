"use client";

import { useAuth } from "./use-auth";
import { useSharedState } from "./use-shared-state";
import { useCallback, useState } from "react";
import type { DemoAccount, KnowledgeEntry, ModelConfig, UploadedAsset } from "@/lib/agents";

const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.error?.message === "string") return data.error.message;
    if (typeof data?.error === "string") return data.error;
  } catch { /* not JSON */ }
  return fallback;
}

export function useSubmitItem() {
  const { apiHeaders, applySharedState, modelConfig } = useSharedState();
  const { has, deny } = useAuth();
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (input: {
    phase: string;
    type: string;
    title: string;
    body: string;
    attachments: UploadedAsset[];
    onResult: (msg: string) => void;
  }) => {
    if (!has("submitLearningContent")) { deny("submitLearningContent"); return; }
    setLoading(true);
    try {
      const response = await fetch(`${appBasePath}/api/items`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ ...input, modelConfig })
      });
      if (!response.ok) { input.onResult(await readApiError(response, "提交失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      input.onResult(result.item.reviewSource === "minimax" || result.item.reviewSource === "custom"
        ? `已提交，AI 审核完成：${result.item.aiSummary || result.item.quality}`
        : `已提交：${result.item.aiSummary || result.item.quality}`);
    } catch {
      input.onResult("网络异常，提交未完成");
    } finally {
      setLoading(false);
    }
  }, [has, deny, apiHeaders, applySharedState, modelConfig]);

  return { submit, loading };
}

export function useLikeItem() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();
  const [loading, setLoading] = useState(false);

  const like = useCallback(async (itemId: string) => {
    if (!has("likeContent")) { deny("likeContent"); return; }
    setLoading(true);
    try {
      const response = await fetch(`${appBasePath}/api/items/like`, {
        method: "POST", headers: apiHeaders(), body: JSON.stringify({ itemId })
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      applySharedState(result.state);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [has, deny, apiHeaders, applySharedState]);

  return { like, loading };
}

export function useUploadImage() {
  const { apiHeaders } = useSharedState();
  const { has, deny } = useAuth();

  const upload = useCallback(async (file: File, onResult: (msg: string) => void, onAsset: (a: UploadedAsset) => void) => {
    if (!has("submitLearningContent")) { deny("submitLearningContent"); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${appBasePath}/api/uploads`, {
        method: "POST", headers: apiHeaders(false), body: formData
      });
      if (!response.ok) { onResult(await readApiError(response, "上传失败")); return; }
      const result = await response.json();
      onAsset(result.asset as UploadedAsset);
      onResult("图片已上传");
    } catch {
      onResult("上传网络异常");
    }
  }, [has, deny, apiHeaders]);

  return { upload };
}

export function useSubmitIdeas() {
  const { apiHeaders, applySharedState, selectedCoCreationGroup } = useSharedState();
  const { has, deny } = useAuth();

  const submit = useCallback(async (ideas: string[], onResult: (msg: string) => void) => {
    if (!has("submitCoCreationIdeas")) { deny("submitCoCreationIdeas"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/ideas`, {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({ ideas, group: selectedCoCreationGroup })
      });
      if (!response.ok) { onResult(await readApiError(response, "提交失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(result.accepted.length
        ? `已提交 ${result.accepted.length} 条有效观点`
        : "没有新的有效观点");
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState, selectedCoCreationGroup]);

  return { submit };
}

export function useRunCoCreation() {
  const { apiHeaders, applySharedState, selectedCoCreationGroup } = useSharedState();
  const { has, deny } = useAuth();

  const run = useCallback(async (ideas: string[], onResult: (msg: string) => void) => {
    if (!has("runCoCreation")) { deny("runCoCreation"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/run`, {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({ ideas, group: selectedCoCreationGroup })
      });
      if (!response.ok) { onResult(await readApiError(response, "运行共创失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(`已收敛归档，保留 ${result.accepted.length} 条新增有效观点`);
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState, selectedCoCreationGroup]);

  return { run };
}

export function useVoteIdea() {
  const { apiHeaders, applySharedState, selectedCoCreationGroup } = useSharedState();
  const { has, deny } = useAuth();

  const vote = useCallback(async (idea: string) => {
    if (!has("likeContent")) { deny("likeContent"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/vote`, {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({ idea, group: selectedCoCreationGroup })
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      applySharedState(result.state);
    } catch { /* silent */ }
  }, [has, deny, apiHeaders, applySharedState, selectedCoCreationGroup]);

  return { vote };
}

export function useUpdateTopic() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();

  const updateTopic = useCallback(async (topic: string, onResult: (msg: string) => void) => {
    if (!has("runCoCreation")) { deny("runCoCreation"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/topics`, {
        method: "POST", headers: apiHeaders(), body: JSON.stringify({ topic })
      });
      if (!response.ok) { onResult(await readApiError(response, "更新失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(`共创主题已更新为：${result.state.coCreation.topic}`);
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState]);

  return { updateTopic };
}

export function useCreatePlan() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();

  const createPlan = useCallback(async (studentName: string, onResult: (msg: string) => void) => {
    if (!has("generatePlan")) { deny("generatePlan"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/plans/generate`, {
        method: "POST", headers: apiHeaders(), body: JSON.stringify({ student: studentName })
      });
      if (!response.ok) { onResult(await readApiError(response, "生成失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(`已为 ${studentName} 生成《个人行动计划》`);
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState]);

  return { createPlan };
}

export function useConfirmPlan() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny, currentAccount } = useAuth();

  const confirmPlan = useCallback(async (studentName?: string) => {
    const target = studentName || currentAccount?.name;
    if (!target) return;
    try {
      const response = await fetch(`${appBasePath}/api/plans/confirm`, {
        method: "POST", headers: apiHeaders(), body: JSON.stringify({ student: target })
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      applySharedState(result.state);
    } catch { /* silent */ }
  }, [has, deny, apiHeaders, applySharedState, currentAccount]);

  return { confirmPlan };
}

export function useSaveAccount() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();

  const saveAccount = useCallback(async (account: DemoAccount, onResult: (msg: string) => void) => {
    if (!has("managePermissions")) { deny("managePermissions"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/admin/accounts`, {
        method: "POST", headers: apiHeaders(), body: JSON.stringify(account)
      });
      if (!response.ok) { onResult(await readApiError(response, "保存失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(`账号已保存：${result.account.name}`);
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState]);

  return { saveAccount };
}

export function useUpdateKnowledge() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();

  const updateKnowledge = useCallback(async (id: string, patch: Partial<KnowledgeEntry>, onResult: (msg: string) => void) => {
    if (!has("managePermissions")) { deny("managePermissions"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/knowledge/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: apiHeaders(), body: JSON.stringify(patch)
      });
      if (!response.ok) { onResult(await readApiError(response, "更新失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult(`已更新：${result.entry.title}`);
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState]);

  return { updateKnowledge };
}

export function useDeleteKnowledge() {
  const { apiHeaders, applySharedState } = useSharedState();
  const { has, deny } = useAuth();

  const deleteKnowledge = useCallback(async (id: string, onResult: (msg: string) => void) => {
    if (!has("managePermissions")) { deny("managePermissions"); return; }
    try {
      const response = await fetch(`${appBasePath}/api/knowledge/${encodeURIComponent(id)}`, {
        method: "DELETE", headers: apiHeaders(false)
      });
      if (!response.ok) { onResult(await readApiError(response, "删除失败")); return; }
      const result = await response.json();
      applySharedState(result.state);
      onResult("已删除");
    } catch {
      onResult("网络异常");
    }
  }, [has, deny, apiHeaders, applySharedState]);

  return { deleteKnowledge };
}

export function useTestModel() {
  const { apiHeaders } = useSharedState();

  const testModel = useCallback(async (config: ModelConfig) => {
    const response = await fetch(`${appBasePath}/api/model/test`, {
      method: "POST", headers: apiHeaders(), body: JSON.stringify({ modelConfig: config })
    });
    if (!response.ok) throw new Error(await readApiError(response, "连接失败"));
    const result = await response.json();
    return `${result.providerName} / ${result.model} 连接成功，样例审核为"${result.sampleQuality}"`;
  }, [apiHeaders]);

  return { testModel };
}
