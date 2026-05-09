import type { PhaseId } from "../agents";
import { reviewWithMiniMax } from "../minimax";
import { getDecryptedModelConfig } from "../services/model-config";

export type Assessment = {
  completeness: number;
  practicality: number;
  improvementSpace: number;
  comment: string;
};

export async function assessTransformationItem(
  itemId: string,
  title: string,
  body: string,
  userId?: string
): Promise<Assessment | null> {
  const structural = assessStructurally(title, body);

  if (userId) {
    try {
      const modelConfig = await getDecryptedModelConfig(userId);
      if (modelConfig?.enabled) {
        const prompt = `对以下转化成果进行三维评估，输出JSON：{"completeness":0-100,"practicality":0-100,"improvementSpace":0-100,"comment":"建议"}。\n\n标题：${title}\n内容：${body}`;
        const result = await reviewWithMiniMax({
          phase: "transformation",
          title: "成果评估",
          body: prompt,
          modelConfig,
        });
        if (result?.aiSummary) {
          try {
            const parsed = JSON.parse(result.aiSummary);
            return {
              completeness: Number(parsed.completeness) || structural.completeness,
              practicality: Number(parsed.practicality) || structural.practicality,
              improvementSpace: Number(parsed.improvementSpace) || structural.improvementSpace,
              comment: parsed.comment || "",
            };
          } catch {
            // fallback
          }
        }
      }
    } catch {
      // fallback
    }
  }

  return structural;
}

function assessStructurally(title: string, body: string): Assessment {
  const text = `${title} ${body}`;
  let completeness = 0;
  let practicality = 0;
  let improvementSpace = 0;

  if (/场景|情境|应用/.test(text)) completeness += 25;
  if (/动作|行动|执行/.test(text)) practicality += 25;
  if (/证据|结果|效果/.test(text)) { completeness += 25; practicality += 25; }
  if (/改进|下一步|优化/.test(text)) improvementSpace += 50;
  if (text.length > 100) { completeness += 25; practicality += 25; }

  const comment = improvementSpace > 0 ? "成果有改进空间，建议补充更具体的行动计划。" : "成果结构完整，建议持续跟踪落地效果。";

  return {
    completeness: Math.min(100, completeness),
    practicality: Math.min(100, practicality),
    improvementSpace: Math.min(100, improvementSpace),
    comment,
  };
}
