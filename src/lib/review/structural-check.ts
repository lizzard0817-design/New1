import type { PhaseId } from "../agents";

type ReviewInput = { title: string; body: string; phase: PhaseId };
type ReviewResult = { quality: "待补充" | "合规" | "优秀"; tags: string[] };

const PHASE_DEFAULT_TAGS: Record<PhaseId, string[]> = {
  "deep-study": ["教学设计", "课堂观察"],
  "practice": ["实训技能", "课堂观察"],
  "reflection": ["结构化反思"],
  "co-creation": ["群体共创"],
  "transformation": ["行动转化"],
};

const PHASE_PATTERNS: Record<PhaseId, { required: RegExp[]; partial: RegExp[] }> = {
  "deep-study": {
    required: [/看到|观察|发现/, /理解|重要|意义/, /迁移|应用|复用/],
    partial: [/课堂|课程|学习/],
  },
  "practice": {
    required: [/照片|现场|记录/, /发现|操作|步骤|技能/, /复用|下次|改进/],
    partial: [/实训|练习/],
  },
  "reflection": {
    required: [/目标|Goal|希望|想要/, /现状|Reality|实际|证据/, /选择|Options|方案|可行/, /行动|Will|决定|第一步/],
    partial: [/反思|回顾/],
  },
  "co-creation": {
    required: [/.+/],
    partial: [/建议|理由|条件/],
  },
  "transformation": {
    required: [/场景|情境|应用/, /动作|行动|执行/, /证据|结果|效果/, /改进|下一步|优化/],
    partial: [/转化|成果/],
  },
};

export function structuralReview(input: ReviewInput): ReviewResult {
  const text = `${input.title} ${input.body}`;
  const patterns = PHASE_PATTERNS[input.phase];
  const defaultTags = PHASE_DEFAULT_TAGS[input.phase];

  if (text.length < 20) {
    return { quality: "待补充", tags: defaultTags };
  }

  const requiredHits = patterns.required.filter((re) => re.test(text)).length;
  const partialHits = patterns.partial.filter((re) => re.test(text)).length;

  const isCoCreation = input.phase === "co-creation";
  let quality: ReviewResult["quality"];

  if (isCoCreation) {
    const lines = input.body.split(/\n/).filter((l) => l.trim());
    const hasReason = lines.some((l) => /因为|理由|由于|所以/.test(l));
    quality = lines.length >= 1 && hasReason ? "优秀" : "合规";
  } else {
    const requiredRatio = requiredHits / patterns.required.length;
    if (requiredRatio >= 1 && partialHits > 0) {
      quality = "优秀";
    } else if (requiredRatio >= 0.5) {
      quality = "合规";
    } else {
      quality = "待补充";
    }
  }

  const keywordTags = extractKeywordTags(text);
  const tags = keywordTags.length > 0 ? keywordTags : defaultTags;

  return { quality, tags };
}

function extractKeywordTags(text: string): string[] {
  const rules: [string, string[]][] = [
    ["教学设计", ["教学", "提问", "课堂", "导入", "活动"]],
    ["课堂观察", ["观察", "发现", "现象", "问题"]],
    ["实训技能", ["操作", "实训", "步骤", "技能", "照片"]],
    ["结构化反思", ["目标", "现状", "选择", "下一步", "反思"]],
    ["群体共创", ["共创", "观点", "投票", "共识"]],
    ["行动转化", ["行动", "计划", "应用", "成果", "转化"]],
  ];

  return rules.filter(([, words]) => words.some((w) => text.includes(w))).map(([tag]) => tag);
}
