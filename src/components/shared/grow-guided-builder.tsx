"use client";

type Props = { draftBody: string; onChange: (body: string) => void; disabled: boolean };

export function GrowGuidedBuilder({ draftBody, onChange, disabled }: Props) {
  const parts = parseGrowBody(draftBody);
  const update = (key: keyof typeof parts, value: string) => {
    onChange(
      [`Goal 目标：${key === "goal" ? value : parts.goal}`,
       `Reality 现状：${key === "reality" ? value : parts.reality}`,
       `Options 选择：${key === "options" ? value : parts.options}`,
       `Will 行动：${key === "will" ? value : parts.will}`].join("\n")
    );
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <p className="text-xs font-medium text-[var(--accent)] mb-3">GROW 分步引导</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "goal" as const, label: "Goal 目标", hint: "你希望改变的具体教学问题" },
          { key: "reality" as const, label: "Reality 现状", hint: "当前真实情况和证据" },
          { key: "options" as const, label: "Options 选择", hint: "可以尝试的多个方案" },
          { key: "will" as const, label: "Will 行动", hint: "下一次明确要做的动作" }
        ].map((f) => (
          <label key={f.key} className="text-[11px] font-medium text-[var(--text-secondary)]">
            {f.label}
            <textarea value={parts[f.key]} onChange={(e) => update(f.key, e.target.value)} disabled={disabled}
              rows={3} placeholder={f.hint}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-[var(--accent)] disabled:opacity-40" />
          </label>
        ))}
      </div>
    </div>
  );
}

function parseGrowBody(body: string) {
  const read = (p: RegExp) => body.match(p)?.[1]?.trim() || "";
  return {
    goal: read(/(?:Goal\s*)?目标[：:]\s*([\s\S]*?)(?=(?:Reality\s*)?现状[：:]|Options\s*选择[：:]|Will\s*行动[：:]|$)/i),
    reality: read(/(?:Reality\s*)?现状[：:]\s*([\s\S]*?)(?=Options\s*选择[：:]|Will\s*行动[：:]|$)/i),
    options: read(/(?:Options\s*)?选择[：:]\s*([\s\S]*?)(?=Will\s*行动[：:]|$)/i),
    will: read(/(?:Will\s*)?行动[：:]\s*([\s\S]*)$/i)
  };
}
