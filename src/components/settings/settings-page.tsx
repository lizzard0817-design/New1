"use client";
import { useState, useEffect } from "react";
import { useSharedState } from "@/hooks/use-shared-state";
import { useAuth } from "@/hooks/use-auth";
import { useSaveAccount, useTestModel } from "@/hooks/use-api";
import { Card, Button, Input } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { SlidersHorizontal, Users, Check, FlaskConical } from "lucide-react";
import { roleProfiles, type DemoAccount, type ModelConfig } from "@/lib/agents";

export function SettingsPage() {
  const { modelConfig, setModelConfig, accounts, setPermissionNotice } = useSharedState();
  const { has } = useAuth();
  const { saveAccount } = useSaveAccount();
  const { testModel } = useTestModel();

  // Model config local state
  const [localConfig, setLocalConfig] = useState<ModelConfig>(modelConfig);
  const [testStatus, setTestStatus] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => { setLocalConfig(modelConfig); }, [modelConfig]);

  const canManage = has("managePermissions");

  return (
    <PageShell title="设置" subtitle="模型配置与账号管理">
      <div className="space-y-8">
        {/* Model Config */}
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <SlidersHorizontal size={16} className="text-[var(--accent)]" /> 模型配置
          </h3>
          <div className="flex items-center gap-3 mb-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={localConfig.enabled}
                onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
              启用自定义模型
            </label>
            <span className="text-xs text-[var(--text-secondary)]">
              {localConfig.enabled ? "提交内容时调用此模型审核" : "使用服务器默认审核"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">供应商</span>
              <Input value={localConfig.providerName} onChange={(e) => setLocalConfig({ ...localConfig, providerName: e.target.value })}
                placeholder="MiniMax / OpenAI" className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">模型名</span>
              <Input value={localConfig.model} onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="MiniMax-M2.7" className="mt-2" />
            </label>
          </div>
          <label className="block mb-4">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Base URL</span>
            <Input value={localConfig.baseUrl} onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1" className="mt-2" />
          </label>
          <label className="block mb-5">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">API Key</span>
            <Input type="password" value={localConfig.apiKey} onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="密钥仅保存在浏览器" className="mt-2" />
          </label>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setModelConfig(localConfig)}>
              <Check size={14} /> 保存
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              setTesting(true); setTestStatus("");
              try { setTestStatus(await testModel(localConfig)); }
              catch (e) { setTestStatus(e instanceof Error ? e.message : "连接失败"); }
              finally { setTesting(false); }
            }} disabled={testing}>
              <FlaskConical size={14} /> {testing ? "测试中..." : "测试连接"}
            </Button>
          </div>
          {testStatus && (
            <p className="mt-4 rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">{testStatus}</p>
          )}
        </Card>

        {/* Account Management (admin only) */}
        {canManage && (
          <AccountManagement accounts={accounts} onSave={(a) => saveAccount(a, setPermissionNotice)} />
        )}
      </div>
    </PageShell>
  );
}

function AccountManagement({ accounts, onSave }: { accounts: DemoAccount[]; onSave: (a: DemoAccount) => void }) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<DemoAccount>({
    id: "", username: "", password: "student123", name: "", role: "student",
    className: "青年教师研修一班", groupName: "第一小组", title: "参训学员", active: true
  });

  function startEdit(account?: DemoAccount) {
    setEditingId(account?.id || "new");
    setDraft(account || {
      id: "", username: "", password: "student123", name: "", role: "student",
      className: "青年教师研修一班", groupName: "第一小组", title: "参训学员", active: true
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users size={16} className="text-[var(--accent)]" /> 账号管理
        </h3>
        <Button size="sm" onClick={() => startEdit()}>新增</Button>
      </div>

      {editingId && (
        <div className="mb-5 rounded-xl bg-[var(--bg-secondary)] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">账号</span>
              <Input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">密码</span>
              <Input value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">姓名</span>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">角色</span>
              <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as any })}
                className="mt-2 w-full rounded-xl bg-white border-0 px-4 py-2.5 text-sm text-[var(--text)] outline-none">
                <option value="student">学员</option>
                <option value="teacher">班主任</option>
                <option value="admin">管理员</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">班级</span>
              <Input value={draft.className} onChange={(e) => setDraft({ ...draft, className: e.target.value })} className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">小组</span>
              <Input value={draft.groupName} onChange={(e) => setDraft({ ...draft, groupName: e.target.value })} className="mt-2" />
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(draft); setEditingId(""); }}>保存</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingId("")}>取消</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {accounts.map((a) => {
          const profile = roleProfiles.find((r) => r.id === a.role);
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-secondary)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{a.username} · {a.groupName} · {a.title}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${a.active === false ? "bg-gray-100 text-gray-400" : "bg-[var(--teal-soft)] text-[var(--accent)]"}`}>
                  {a.active === false ? "停用" : profile?.name}
                </span>
                <button onClick={() => startEdit(a)} className="rounded-full px-3 py-1 text-[11px] hover:bg-gray-200">编辑</button>
                <button onClick={() => onSave({ ...a, active: a.active === false })} className="rounded-full px-3 py-1 text-[11px] hover:bg-gray-200">
                  {a.active === false ? "启用" : "停用"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
