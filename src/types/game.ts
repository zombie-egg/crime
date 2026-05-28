export type Difficulty = "easy" | "medium" | "hard";
export type ClueType = "object" | "pose" | "scene" | "other";
export type AITool = "yolo" | "mediapipe" | "classification" | "llm" | "imagegen";
export type CaseStatus = "locked" | "unlocked" | "completed";
export type ThemeMode = "dark" | "light";
export type Locale = "zh" | "en";

export interface Case {
  id: string;
  title: string;
  description: string;
  briefing: string;
  knownFacts: string[];
  timeline: Array<{
    time: string;
    event: string;
  }>;
  investigationGoal: string;
  evidenceOptions: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  videoUrl: string;
  videoCredit?: {
    title: string;
    source: string;
    license: string;
  };
  difficulty: Difficulty;
  timeLimit: number;
  clues: Clue[];
  suspects: Suspect[];
  correctAnswer: {
    culprit: string;
    tools: string[];
    motive?: string;
  };
  unlocked: boolean;
  completed: boolean;
  stars: number;
  endingTexts: Record<"perfect" | "good" | "normal", string>;
}

export interface Clue {
  id: string;
  type: ClueType;
  description: string;
  found: boolean;
  timestamp: number;
  aiTool: AITool;
  evidence?: string;
  confidence?: number;
}

export interface Suspect {
  id: string;
  name: string;
  avatar: string;
  description: string;
  role?: string;
  access?: string;
  motive?: string;
  alibi?: string;
  contradiction?: string;
}

export interface ToolUseState {
  yolo: number;
  mediapipe: number;
  classification: number;
  llm: number;
  imagegen: number;
}

export interface DetectionBox {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  clueId?: string;
}

export interface PosePoint {
  x: number;
  y: number;
  score: number;
}

export interface PoseResult {
  id: string;
  label: string;
  confidence: number;
  timestamp: number;
  keypoints: PosePoint[];
  clueId?: string;
}

export interface ClassificationResult {
  label: string;
  confidence: number;
}

export interface TimelineAction {
  time: number;
  label: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: number;
}

export interface DeductionSubmission {
  culprit: string;
  tools: string[];
  motive: string;
}

export interface ScoreBreakdown {
  clueCompleteness: number;
  deductionAccuracy: number;
  timeEfficiency: number;
  toolEfficiency: number;
  total: number;
  stars: number;
  rank: "perfect" | "good" | "normal";
  directorComment: string;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}
