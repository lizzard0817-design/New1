"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Settings, Zap, CheckCircle, XCircle } from "lucide-react";

export default function ModelSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    enabled: false,
    providerName: "MiniMax",
    baseUrl: "https://api.minimax.io/v1",
    model: "MiniMax-M2.7",
    apiKey: "",
  });
  const [savedConfig, setSavedConfig] = useState<{ apiKeyMasked: string; hasKey: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency?: number; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/model/config").then(r => r.json()).then((data) => {
      if (data) {
        setConfig({
          enabled: data.enabled || false,
          providerName: data.providerName || "MiniMax",
          baseUrl: data.baseUrl || "",
          model: data.model || "",
          apiKey: "",
        });
        setSavedConfig({ apiKeyMasked: data.apiKeyMasked || "", hasKey: data.hasKey || false });
      }
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/model/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedConfig({ apiKeyMasked: data.apiKeyMasked || "", hasKey: !!config.apiKey || data.hasKey });
        setNotice("模型配置已保存");
        setConfig((c) => ({ ...c, apiKey: "" }));
      } else {
        const data = await res.json();
        setNotice(data.error || "保存失败");
      }
    } catch {
      setNotice("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/model/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "网络错误" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-[var(--muted)]" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">模型配置</h2>
      </div>

      <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--foreground)]">启用外部模型</label>
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))} className="w-4 h-4" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">服务商名称</label>
          <input value={config.providerName} onChange={(e) => setConfig((c) => ({ ...c, providerName: e.target.value }))} className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">API Base URL</label>
          <input value={config.baseUrl} onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))} placeholder="https://api.openai.com/v1" className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">模型名称</label>
          <input value={config.model} onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))} className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">API Key</label>
          <input type="password" value={config.apiKey} onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))} placeholder={savedConfig?.hasKey ? `当前：${savedConfig.apiKeyMasked}（留空保留）` : "输入 API Key"} className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
          <p className="text-xs text-[var(--muted)] mt-1">API Key 将加密存储在服务器端，不会在前端请求中传输。</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "保存中..." : "保存配置"}
          </button>
          {config.enabled && (
            <button onClick={handleTest} disabled={testing} className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--line)] text-sm hover:bg-[var(--surface-strong)] disabled:opacity-50">
              <Zap className="w-4 h-4" />
              {testing ? "测试中..." : "测试连接"}
            </button>
          )}
        </div>

        {notice && <p className="text-sm text-[var(--teal)]">{notice}</p>}

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.ok ? "text-[var(--teal)]" : "text-[var(--coral)]"}`}>
            {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.ok ? `连接成功（${testResult.latency}ms）` : `连接失败：${testResult.error}`}
          </div>
        )}
      </div>
    </div>
  );
}
