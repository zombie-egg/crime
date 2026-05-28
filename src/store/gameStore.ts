import { create } from "zustand";
import { persist } from "zustand/middleware";
import { achievementsSeed, caseFiles, toolLimits } from "@/data/cases";
import { scoreCase } from "@/lib/scoring";
import { createId } from "@/lib/utils";
import type {
  Achievement,
  Case,
  ChatMessage,
  DeductionSubmission,
  ScoreBreakdown,
  ThemeMode,
  ToolUseState,
} from "@/types/game";

interface GameState {
  cases: Case[];
  activeCaseId?: string;
  resultCaseId?: string;
  remainingTime: Record<string, number>;
  toolUses: Record<string, ToolUseState>;
  chatMessages: Record<string, ChatMessage[]>;
  latestScore?: ScoreBreakdown;
  achievements: Achievement[];
  locale: "zh" | "en";
  theme: ThemeMode;
  playerLevel: number;
  leaderboard: Array<{ id: string; caseTitle: string; total: number; stars: number; createdAt: number }>;
  startCase: (caseId: string) => void;
  tickCase: (caseId: string) => void;
  setRemainingTime: (caseId: string, time: number) => void;
  useTool: (caseId: string, tool: keyof ToolUseState) => boolean;
  revealCluesByTool: (caseId: string, tool: keyof ToolUseState) => string[];
  revealClue: (caseId: string, clueId: string) => void;
  addChatMessage: (caseId: string, message: Omit<ChatMessage, "id" | "createdAt">) => void;
  submitDeduction: (caseId: string, submission: DeductionSubmission) => ScoreBreakdown;
  resetCase: (caseId: string) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
}

const initialToolUses = (): ToolUseState => ({
  yolo: toolLimits.yolo,
  mediapipe: toolLimits.mediapipe,
  classification: toolLimits.classification,
  llm: toolLimits.llm,
  imagegen: toolLimits.imagegen,
});

const initialRemainingTime = () => Object.fromEntries(caseFiles.map((caseFile) => [caseFile.id, caseFile.timeLimit]));
const initialToolUseMap = () => Object.fromEntries(caseFiles.map((caseFile) => [caseFile.id, initialToolUses()]));

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      cases: caseFiles,
      remainingTime: initialRemainingTime(),
      toolUses: initialToolUseMap(),
      chatMessages: {},
      achievements: achievementsSeed,
      locale: "zh",
      theme: "light",
      playerLevel: 7,
      leaderboard: [],
      startCase: (caseId) => {
        const state = get();
        const nextChatMessages = state.chatMessages[caseId]?.length
          ? state.chatMessages
          : {
              ...state.chatMessages,
              [caseId]: [
                {
                  id: createId("msg"),
                  role: "assistant" as const,
                  content:
                    "先读嫌疑人档案。视频只提供现场环境和异常点；凶手判断要靠权限、动机、矛盾点和已解锁线索交叉验证。",
                  createdAt: Date.now(),
                },
              ],
            };

        if (state.activeCaseId === caseId && nextChatMessages === state.chatMessages) return;
        set({ activeCaseId: caseId, chatMessages: nextChatMessages });
      },
      tickCase: (caseId) => {
        set((state) => {
          const current = state.remainingTime[caseId] ?? 0;
          if (current <= 0) return state;
          return {
            remainingTime: {
              ...state.remainingTime,
              [caseId]: current - 1,
            },
          };
        });
      },
      setRemainingTime: (caseId, time) => {
        set((state) => {
          const nextTime = Math.max(0, time);
          if (state.remainingTime[caseId] === nextTime) return state;
          return { remainingTime: { ...state.remainingTime, [caseId]: nextTime } };
        });
      },
      useTool: (caseId, tool) => {
        const state = get();
        if (tool === "llm") return true;
        const current = state.toolUses[caseId] ?? initialToolUses();
        if (current[tool] <= 0) return false;
        set({
          toolUses: {
            ...state.toolUses,
            [caseId]: { ...current, [tool]: current[tool] - 1 },
          },
        });
        return true;
      },
      revealCluesByTool: (caseId, tool) => {
        const state = get();
        const caseFile = state.cases.find((item) => item.id === caseId);
        if (!caseFile) return [];
        const clueIds = caseFile.clues.filter((clue) => clue.aiTool === tool && !clue.found).map((clue) => clue.id);
        if (!clueIds.length) return [];
        set((current) => ({
          cases: current.cases.map((item) =>
            item.id === caseId
              ? {
                  ...item,
                  clues: item.clues.map((clue) =>
                    clueIds.includes(clue.id) ? { ...clue, found: true } : clue,
                  ),
                }
              : item,
          ),
          achievements: current.achievements.map((achievement) =>
            achievement.id === "first-clue" ? { ...achievement, unlocked: true } : achievement,
          ),
        }));
        return clueIds;
      },
      revealClue: (caseId, clueId) => {
        const state = get();
        const target = state.cases.find((caseFile) => caseFile.id === caseId);
        const clue = target?.clues.find((item) => item.id === clueId);
        if (!clue || clue.found) return;
        set((current) => ({
          cases: current.cases.map((caseFile) =>
            caseFile.id === caseId
              ? {
                  ...caseFile,
                  clues: caseFile.clues.map((item) => (item.id === clueId ? { ...item, found: true } : item)),
                }
              : caseFile,
          ),
          achievements: current.achievements.map((achievement) =>
            achievement.id === "first-clue" ? { ...achievement, unlocked: true } : achievement,
          ),
        }));
      },
      addChatMessage: (caseId, message) => {
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [caseId]: [
              ...(state.chatMessages[caseId] ?? []),
              { ...message, id: createId("msg"), createdAt: Date.now() },
            ],
          },
        }));
      },
      submitDeduction: (caseId, submission) => {
        const state = get();
        const caseFile = state.cases.find((item) => item.id === caseId);
        if (!caseFile) throw new Error(`Case ${caseId} not found`);
        const score = scoreCase(caseFile, submission, state.remainingTime[caseId] ?? 0, state.toolUses[caseId]);
        set((current) => ({
          latestScore: score,
          resultCaseId: caseId,
          cases: current.cases.map((item, index) => {
            if (item.id === caseId) return { ...item, completed: true, stars: Math.max(item.stars, score.stars) };
            const completedIndex = current.cases.findIndex((candidate) => candidate.id === caseId);
            if (index === completedIndex + 1) return { ...item, unlocked: true };
            return item;
          }),
          achievements: current.achievements.map((achievement) => {
            if (achievement.id === "perfect-case" && score.stars === 5) return { ...achievement, unlocked: true };
            if (
              achievement.id === "tool-saver" &&
              current.toolUses[caseId].yolo + current.toolUses[caseId].mediapipe + current.toolUses[caseId].classification >= 5
            ) {
              return { ...achievement, unlocked: true };
            }
            return achievement;
          }),
          leaderboard: [
            {
              id: createId("score"),
              caseTitle: caseFile.title,
              total: score.total,
              stars: score.stars,
              createdAt: Date.now(),
            },
            ...current.leaderboard,
          ].slice(0, 8),
        }));
        return score;
      },
      resetCase: (caseId) => {
        const original = caseFiles.find((item) => item.id === caseId);
        if (!original) return;
        set((state) => ({
          latestScore: undefined,
          resultCaseId: undefined,
          remainingTime: { ...state.remainingTime, [caseId]: original.timeLimit },
          toolUses: { ...state.toolUses, [caseId]: initialToolUses() },
          chatMessages: { ...state.chatMessages, [caseId]: [] },
          cases: state.cases.map((item) =>
            item.id === caseId
              ? {
                  ...item,
                  completed: false,
                  stars: 0,
                  clues: item.clues.map((clue) => ({ ...clue, found: false })),
                }
              : item,
          ),
        }));
      },
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      toggleLocale: () => set((state) => ({ locale: state.locale === "zh" ? "en" : "zh" })),
    }),
    {
      name: "neon-detective-state",
      version: 5,
      migrate: () => ({
        cases: caseFiles,
        achievements: achievementsSeed,
        leaderboard: [],
        theme: "light" as ThemeMode,
        locale: "zh" as const,
      }),
      partialize: (state) => ({
        cases: state.cases,
        achievements: state.achievements,
        leaderboard: state.leaderboard,
        theme: state.theme,
        locale: state.locale,
      }),
    },
  ),
);
