import type { PhaseId, ContentType } from "./agents";

export const typeByPhase: Record<PhaseId, ContentType> = {
  "deep-study": "批注",
  practice: "即时贴",
  reflection: "反思案例",
  "co-creation": "观点",
  transformation: "转化案例"
};

export const toneClass = {
  teal: "text-teal-700 bg-teal-50 border-teal-200",
  coral: "text-[#bd5145] bg-[#fff0ee] border-[#f2c5bf]",
  violet: "text-[#6d5bd0] bg-[#f1edff] border-[#d9d1ff]",
  amber: "text-[#92620f] bg-[#fff4d8] border-[#eed38e]",
  rose: "text-[#a43f5a] bg-[#fde9ef] border-[#f2bdcd]"
};

export const submissionBlueprints: Record<
  PhaseId,
  {
    titleLabel: string;
    bodyLabel: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    defaultTitle: string;
    defaultBody: string;
    submitLabel: string;
    outputHint: string;
    templateSections: Array<{ label: string; detail: string }>;
    qualityChecks: string[];
  }
> = {
  "deep-study": {
    titleLabel: "批注标题",
    bodyLabel: "学习批注",
    titlePlaceholder: "例如：课堂提问链观察",
    bodyPlaceholder: "按「我看到什么、我理解什么、我准备怎么迁移」来写。",
    defaultTitle: "课堂提问链观察",
    defaultBody: "我看到：学生在小组讨论中容易等待少数同学给答案。\n我理解：问题链如果只停留在事实层，学生很难说明理由。\n我迁移：下一次课堂先设计事实性问题，再追问理由，并让每个小组成员承担记录、汇报或质询角色。",
    submitLabel: "提交学习批注",
    outputHint: "系统会判断是否具体、有效、可迁移。",
    templateSections: [
      { label: "看到什么", detail: "记录课程中一个具体观点、方法或课堂现象。" },
      { label: "为什么重要", detail: "说明它对教学、学习或班级管理的价值。" },
      { label: "如何迁移", detail: "写出下一次准备怎么试用或调整。" }
    ],
    qualityChecks: ["有具体观察", "有个人理解", "有迁移动作"]
  },
  practice: {
    titleLabel: "即时贴标题",
    bodyLabel: "照片说明与技能要点",
    titlePlaceholder: "例如：小组角色分工跟练记录",
    bodyPlaceholder: "按「照片内容、现场发现、操作经验、下次复用」来写。",
    defaultTitle: "小组角色分工跟练记录",
    defaultBody: "照片内容：第三组讨论时只有组长发言，其他成员沉默。\n现场发现：任务卡没有分配角色，学生不知道自己负责什么。\n操作经验：加入记录员、汇报员、质询员三类角色后，讨论更容易形成分工。\n下次复用：我会在任务卡上直接写清每个角色的产出要求。",
    submitLabel: "提交即时贴",
    outputHint: "后续可接入真实图片上传；当前先提交照片说明和技能证据。",
    templateSections: [
      { label: "照片内容", detail: "说明照片记录的实训场景或关键动作。" },
      { label: "现场发现", detail: "写清问题、变化或技能要点。" },
      { label: "复用方法", detail: "说明下次如何沿用这次跟练经验。" }
    ],
    qualityChecks: ["能还原现场", "有操作动作", "可复用"]
  },
  reflection: {
    titleLabel: "反思案例标题",
    bodyLabel: "GROW 反思案例",
    titlePlaceholder: "例如：学生讨论参与不均衡",
    bodyPlaceholder: "按 Goal、Reality、Options、Will 四段写完整。",
    defaultTitle: "学生讨论参与不均衡",
    defaultBody: "Goal 目标：让每个小组成员都能参与讨论。\nReality 现状：发言集中在少数学生身上，部分学生等待组长给答案。\nOptions 选择：角色分工、发言计时、同伴追问、任务卡明确产出。\nWill 行动：下一节课在任务卡中明确记录员、汇报员、质询员的产出，并观察参与变化。",
    submitLabel: "提交反思案例",
    outputHint: "系统会检查目标、现状、选择和行动是否完整。",
    templateSections: [
      { label: "Goal", detail: "你希望改变什么具体教学问题。" },
      { label: "Reality", detail: "当前真实情况是什么，有什么证据。" },
      { label: "Options / Will", detail: "有哪些选择，最终下一步怎么做。" }
    ],
    qualityChecks: ["目标清晰", "现状有证据", "行动可执行"]
  },
  "co-creation": {
    titleLabel: "观点主题",
    bodyLabel: "共创观点",
    titlePlaceholder: "例如：训后转化支持机制",
    bodyPlaceholder: "每行一条观点，建议写成：建议 + 理由 + 落地条件。",
    defaultTitle: "训后转化支持机制",
    defaultBody: "建立转化案例模板：让学员按统一结构提交成果，便于教师评估和下一期复用。\n设置训后 3 个月成果复盘：避免培训结束后无人跟进。\n增加同伴互评反馈：让同组学员互相补充落地建议。",
    submitLabel: "提交共创观点",
    outputHint: "系统会去重、分类，并等待班主任运行收敛。",
    templateSections: [
      { label: "建议", detail: "提出一个可执行的改进动作。" },
      { label: "理由", detail: "说明为什么它对班级或培训有价值。" },
      { label: "条件", detail: "说明落地需要谁配合、什么材料或节点。" }
    ],
    qualityChecks: ["一行一观点", "可执行", "有理由"]
  },
  transformation: {
    titleLabel: "成果标题",
    bodyLabel: "转化成果或案例",
    titlePlaceholder: "例如：D+30 提问链课堂应用",
    bodyPlaceholder: "按「应用场景、采取动作、结果证据、下一步改进」来写。",
    defaultTitle: "D+30 提问链课堂应用",
    defaultBody: "应用场景：项目导入课的小组讨论环节。\n采取动作：使用事实性问题、解释性问题、迁移性问题三段式提问链。\n结果证据：学生回答更愿意说明理由，小组汇报更聚焦。\n下一步改进：继续记录不同问题类型对学生参与度的影响。",
    submitLabel: "提交转化成果",
    outputHint: "系统会初评完成度、落地性和改进空间。",
    templateSections: [
      { label: "应用场景", detail: "在哪节课、哪个班级或哪个任务中使用。" },
      { label: "结果证据", detail: "用学生表现、作品、数据或观察证明已落地。" },
      { label: "改进计划", detail: "说明下一轮准备怎么优化。" }
    ],
    qualityChecks: ["有应用场景", "有结果证据", "有改进动作"]
  }
};

export function defaultDraftForPhase(phase: PhaseId) {
  const blueprint = submissionBlueprints[phase];
  return { title: blueprint.defaultTitle, body: blueprint.defaultBody };
}
