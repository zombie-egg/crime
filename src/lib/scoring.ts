import type { Case, DeductionSubmission, ScoreBreakdown, ToolUseState } from "@/types/game";
import { roundScore } from "@/lib/utils";
import { toolLimits } from "@/data/cases";

export function scoreCase(
  caseFile: Case,
  submission: DeductionSubmission,
  remainingTime: number,
  toolsRemaining: ToolUseState,
): ScoreBreakdown {
  const foundCount = caseFile.clues.filter((clue) => clue.found).length;
  const clueCompleteness = roundScore((foundCount / caseFile.clues.length) * 100);

  const culpritCorrect = submission.culprit === caseFile.correctAnswer.culprit ? 50 : 0;
  const requiredTools = new Set(caseFile.correctAnswer.tools);
  const selectedTools = new Set(submission.tools);
  const matchedTools = [...requiredTools].filter((tool) => selectedTools.has(tool)).length;
  const toolAccuracy = requiredTools.size > 0 ? (matchedTools / requiredTools.size) * 35 : 35;
  const motiveWords = caseFile.correctAnswer.motive?.split(/\s|，|。|、/).filter(Boolean) ?? [];
  const motiveHit = motiveWords.some((word) => word.length > 1 && submission.motive.includes(word));
  const motiveScore = motiveHit || submission.motive.trim().length > 8 ? 15 : 0;
  const deductionAccuracy = roundScore(culpritCorrect + toolAccuracy + motiveScore);

  const timeEfficiency = roundScore((remainingTime / caseFile.timeLimit) * 100);
  const finiteToolBudget = toolLimits.yolo + toolLimits.mediapipe + toolLimits.classification + toolLimits.imagegen;
  const remainingFiniteUses =
    toolsRemaining.yolo + toolsRemaining.mediapipe + toolsRemaining.classification + toolsRemaining.imagegen;
  const toolEfficiency = roundScore((remainingFiniteUses / finiteToolBudget) * 100);

  const total = roundScore(
    clueCompleteness * 0.34 + deductionAccuracy * 0.36 + timeEfficiency * 0.16 + toolEfficiency * 0.14,
  );
  const stars = total >= 92 ? 5 : total >= 78 ? 4 : total >= 62 ? 3 : total >= 45 ? 2 : 1;
  const rank = stars >= 5 ? "perfect" : stars >= 3 ? "good" : "normal";

  return {
    clueCompleteness,
    deductionAccuracy,
    timeEfficiency,
    toolEfficiency,
    total,
    stars,
    rank,
    directorComment: buildDirectorComment(caseFile, total, rank),
  };
}

function buildDirectorComment(caseFile: Case, total: number, rank: ScoreBreakdown["rank"]) {
  const tone = {
    perfect: "剪辑台上的每一帧都被你压成了证词。",
    good: "你的推理足够让嫌疑人失去退路。",
    normal: "你抓住了主线，但证据链仍有松动处。",
  }[rank];

  return `${tone} 本案得分 ${total}，结局：${caseFile.endingTexts[rank]}`;
}
