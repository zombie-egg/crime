import type {
  AITool,
  Case,
  ClassificationResult,
  DetectionBox,
  PoseResult,
  TimelineAction,
} from "@/types/game";

export interface AnalyzerContext {
  caseFile: Case;
  currentTime: number;
  video?: HTMLVideoElement | null;
}

export interface YOLOAnalysis {
  detections: DetectionBox[];
  summary: string;
}

export interface PoseAnalysis {
  poses: PoseResult[];
  timeline: TimelineAction[];
  summary: string;
}

export interface SceneAnalysis {
  labels: ClassificationResult[];
  summary: string;
}

export interface ReconstructionResult {
  imageUrl?: string;
  prompt: string;
  summary: string;
}

const resultCache = new Map<string, YOLOAnalysis | PoseAnalysis | SceneAnalysis | ReconstructionResult>();

export async function analyzeObjects(context: AnalyzerContext): Promise<YOLOAnalysis> {
  const key = cacheKey("yolo", context);
  const cached = resultCache.get(key);
  if (cached) return cached as YOLOAnalysis;

  await opportunisticModelImport("yolo");
  const objectClues = context.caseFile.clues.filter((clue) => clue.aiTool === "yolo");
  const detections = objectClues.map((clue, index) => ({
    id: `det-${clue.id}`,
    label: objectLabelFromClueId(clue.id),
    confidence: clue.confidence ?? 0.84,
    x: 16 + index * 31,
    y: 28 + index * 13,
    width: 20 + index * 3,
    height: 18 + index * 4,
    clueId: clue.id,
  }));

  const topConfidence = detections.length
    ? Math.round(Math.max(...detections.map((item) => item.confidence)) * 100)
    : 0;
  const result = {
    detections,
    summary: `物体检测发现 ${detections.length} 个可疑物体，最高置信度 ${topConfidence}%。先把物证和嫌疑人的接触权限对应起来。`,
  };
  resultCache.set(key, result);
  return result;
}

export async function analyzePose(context: AnalyzerContext): Promise<PoseAnalysis> {
  const key = cacheKey("mediapipe", context);
  const cached = resultCache.get(key);
  if (cached) return cached as PoseAnalysis;

  await opportunisticModelImport("mediapipe");
  const clue = context.caseFile.clues.find((item) => item.aiTool === "mediapipe");
  const keypoints = [
    { x: 48, y: 22, score: 0.94 },
    { x: 45, y: 36, score: 0.9 },
    { x: 55, y: 36, score: 0.9 },
    { x: 40, y: 53, score: 0.86 },
    { x: 61, y: 55, score: 0.85 },
    { x: 42, y: 72, score: 0.8 },
    { x: 58, y: 72, score: 0.79 },
  ];
  const label = poseLabelFromCase(context.caseFile.id);
  const confidence = clue?.confidence ?? 0.82;
  const result = {
    poses: [
      {
        id: `pose-${context.caseFile.id}`,
        label,
        confidence,
        timestamp: clue?.timestamp ?? context.currentTime,
        keypoints,
        clueId: clue?.id,
      },
    ],
    timeline: [
      { time: Math.max(0, context.currentTime - 6), label: "进入关键区域", confidence: 0.74 },
      { time: clue?.timestamp ?? context.currentTime, label, confidence },
      { time: context.currentTime + 5, label: "离开关键区域", confidence: 0.72 },
    ],
    summary: `姿态分析匹配“${label}”，置信度 ${Math.round(confidence * 100)}%。该动作和关键时间点重叠，可用于验证作案路线。`,
  };
  resultCache.set(key, result);
  return result;
}

export async function classifyScene(context: AnalyzerContext): Promise<SceneAnalysis> {
  const key = cacheKey("classification", context);
  const cached = resultCache.get(key);
  if (cached) return cached as SceneAnalysis;

  await opportunisticModelImport("classification");
  const sceneMap: Record<string, ClassificationResult[]> = {
    "museum-shadow": [
      { label: "museum", confidence: 0.91 },
      { label: "indoor", confidence: 0.96 },
      { label: "night", confidence: 0.87 },
      { label: "low-light CCTV", confidence: 0.79 },
    ],
    "rainy-alley": [
      { label: "alley", confidence: 0.9 },
      { label: "outdoor", confidence: 0.86 },
      { label: "rainy night", confidence: 0.88 },
      { label: "heavy occlusion", confidence: 0.76 },
    ],
    "harbor-signal": [
      { label: "harbor", confidence: 0.86 },
      { label: "warehouse", confidence: 0.83 },
      { label: "pre-dawn", confidence: 0.78 },
      { label: "long-range CCTV", confidence: 0.8 },
    ],
  };
  const labels = sceneMap[context.caseFile.id] ?? sceneMap["museum-shadow"];
  const result = {
    labels,
    summary: `场景分类结果：${labels
      .slice(0, 3)
      .map((item) => `${item.label} ${Math.round(item.confidence * 100)}%`)
      .join(" / ")}。用它判断视频环境是否支持嫌疑人的说法。`,
  };
  resultCache.set(key, result);
  return result;
}

export async function askAssistant(prompt: string, caseFile: Case, foundClues: string[]) {
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        caseTitle: caseFile.title,
        caseBriefing: caseFile.briefing,
        suspects: caseFile.suspects.map((suspect) => `${suspect.name}：${suspect.description}`),
        foundClues,
      }),
    });

    if (!response.ok) throw new Error(`Assistant API ${response.status}`);
    const data = (await response.json()) as { answer?: string };
    const answer = data.answer?.trim();
    if (!answer || answer.includes("AI assistant received the clues")) {
      return offlineAssistant(prompt, caseFile, foundClues);
    }
    return answer;
  } catch {
    return offlineAssistant(prompt, caseFile, foundClues);
  }
}

export async function generateReconstruction(caseFile: Case, foundClues: string[]): Promise<ReconstructionResult> {
  const prompt = buildReconstructionPrompt(caseFile, foundClues);
  try {
    const response = await fetch("/api/reconstruct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caseTitle: caseFile.title,
        prompt,
        foundClues,
      }),
    });

    if (!response.ok) throw new Error(`Image API ${response.status}`);
    const data = (await response.json()) as { imageUrl?: string; summary?: string };
    return {
      imageUrl: data.imageUrl,
      prompt,
      summary: data.summary || "视觉重建已生成，已把关键物证、姿态和场景关系合成一张案发过程图。",
    };
  } catch {
    return {
      prompt,
      summary: "文字生图接口暂不可用，已生成可用于演示报告的重建提示词，并解锁视觉重建线索。",
    };
  }
}

export function toolToClueType(tool: AITool) {
  return tool === "yolo" ? "object" : tool === "mediapipe" ? "pose" : tool === "classification" ? "scene" : "other";
}

function cacheKey(tool: AITool, context: AnalyzerContext) {
  return `${context.caseFile.id}:${tool}:${Math.floor(context.currentTime / 10)}`;
}

async function opportunisticModelImport(tool: AITool) {
  try {
    if (tool === "yolo") {
      await Promise.all([import("@tensorflow/tfjs"), import("@tensorflow-models/coco-ssd")]);
    }
    if (tool === "classification") {
      await Promise.all([import("@tensorflow/tfjs"), import("@tensorflow-models/mobilenet")]);
    }
    if (tool === "mediapipe") {
      await import("@mediapipe/tasks-vision");
    }
  } catch {
    // The playable demo falls back to curated case analysis if model files or network are unavailable.
  }
}

function buildReconstructionPrompt(caseFile: Case, foundClues: string[]) {
  const clues = foundClues.length ? foundClues.join("；") : "尚未发现足够线索";
  return [
    `为互动侦探游戏《${caseFile.title}》生成一张案发过程视觉重建图。`,
    `画面风格：蒙德里安构图、黑色粗线、红黄蓝色块、监控录像质感、推理板标注。`,
    `必须表现已发现线索：${clues}。`,
    `不要出现真实名人或血腥画面；输出应像课堂项目展示用的案件复盘插图。`,
  ].join("\n");
}

function objectLabelFromClueId(clueId: string) {
  if (clueId.includes("glove")) return "black glove";
  if (clueId.includes("crowbar")) return "crowbar";
  if (clueId.includes("umbrella")) return "yellow umbrella";
  if (clueId.includes("filmcase")) return "film case";
  if (clueId.includes("laser")) return "laser marker";
  if (clueId.includes("case")) return "evidence case";
  return "evidence object";
}

function poseLabelFromCase(caseId: string) {
  if (caseId === "museum-shadow") return "弯腰取物姿态";
  if (caseId === "rainy-alley") return "回头确认姿态";
  if (caseId === "harbor-signal") return "举手示意姿态";
  return "可疑姿态";
}

function offlineAssistant(prompt: string, caseFile: Case, foundClues: string[]) {
  const discovered = foundClues.length;
  const asksForCulprit = /谁|犯人|嫌疑|culprit/i.test(prompt);
  if (discovered === 0) {
    return `《${caseFile.title}》还没有足够证据。先读嫌疑人档案，再用 AI 工具补齐现场异常点。`;
  }
  if (asksForCulprit) {
    return `凶手不靠视频露脸判断。把 ${discovered} 条线索和嫌疑人的权限、动机、矛盾点逐项比对。`;
  }
  return `已发现 ${discovered} 条线索。下一步看哪名嫌疑人的档案能同时解释权限、动机和作案工具。`;
}
