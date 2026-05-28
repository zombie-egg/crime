import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Boxes, ImagePlus, Loader2, ScanSearch, Tags, UserRoundSearch } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toolDescriptions, toolLabels, toolLimits } from "@/data/cases";
import { analyzeObjects, analyzePose, classifyScene, generateReconstruction } from "@/lib/ai/analyzers";
import { playSound } from "@/lib/audio";
import { useGameStore } from "@/store/gameStore";
import type { AITool, Case, ClassificationResult, TimelineAction } from "@/types/game";

interface AIToolboxProps {
  caseFile: Case;
  currentTime: number;
}

export default function AIToolbox({ caseFile, currentTime }: AIToolboxProps) {
  const { toolUses, useTool: consumeTool, revealCluesByTool, revealClue, addChatMessage } = useGameStore();
  const [loading, setLoading] = useState<AITool | null>(null);
  const [summary, setSummary] = useState("选择一个 AI 工具分析当前帧，结果会写入线索记录本。");
  const [sceneLabels, setSceneLabels] = useState<ClassificationResult[]>([]);
  const [timeline, setTimeline] = useState<TimelineAction[]>([]);
  const [reconstruction, setReconstruction] = useState<{ imageUrl?: string; prompt: string } | null>(null);
  const currentUses = { ...toolLimits, ...(toolUses[caseFile.id] ?? {}) };

  const runTool = async (tool: AITool) => {
    if (loading) return;
    const allowed = consumeTool(caseFile.id, tool as keyof typeof currentUses);
    if (!allowed) return;
    playSound("scan");
    setLoading(tool);
    try {
      if (tool === "yolo") {
        const result = await analyzeObjects({ caseFile, currentTime });
        const ids = revealCluesByTool(caseFile.id, "yolo");
        result.detections.forEach((item) => item.clueId && revealClue(caseFile.id, item.clueId));
        setSummary(`${result.summary} 新增 ${ids.length} 条物体线索。`);
        if (ids.length) playSound("clue");
      }
      if (tool === "mediapipe") {
        const result = await analyzePose({ caseFile, currentTime });
        revealCluesByTool(caseFile.id, "mediapipe");
        setTimeline(result.timeline);
        setSummary(result.summary);
        playSound("clue");
      }
      if (tool === "classification") {
        const result = await classifyScene({ caseFile, currentTime });
        revealCluesByTool(caseFile.id, "classification");
        setSceneLabels(result.labels);
        setSummary(result.summary);
        playSound("clue");
      }
      if (tool === "llm") {
        revealCluesByTool(caseFile.id, "llm");
        addChatMessage(caseFile.id, {
          role: "assistant",
          content: "我已把可疑排班、票据或权限记录加入推理上下文。可以在右下角继续追问。",
        });
        setSummary("AI助手补充了一条文档型线索，并更新了推理上下文。");
        playSound("clue");
      }
      if (tool === "imagegen") {
        const foundClues = caseFile.clues.filter((clue) => clue.found).map((clue) => clue.description);
        const result = await generateReconstruction(caseFile, foundClues);
        revealCluesByTool(caseFile.id, "imagegen");
        setReconstruction({ imageUrl: result.imageUrl, prompt: result.prompt });
        setSummary(result.summary);
        addChatMessage(caseFile.id, {
          role: "assistant",
          content: "视觉重建器已把物证、场景和姿态合成复盘图。现在可以用它检查作案路线是否自洽。",
        });
        playSound("clue");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="overflow-hidden border border-fuchsia-400/20 bg-white/5">
      <CardHeader className="border-b border-fuchsia-400/20 bg-black/45">
        <CardTitle className="flex items-center gap-2 text-white">
          <ScanSearch className="h-5 w-5 text-[#ff184f]" />
          AI 工具箱
        </CardTitle>
        <CardDescription>本地模型按需加载；失败时使用案件内置分析结果。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3">
          <ToolButton tool="yolo" icon={<Boxes className="h-5 w-5" />} remaining={currentUses.yolo} loading={loading === "yolo"} onClick={() => runTool("yolo")} />
          <ToolButton tool="mediapipe" icon={<UserRoundSearch className="h-5 w-5" />} remaining={currentUses.mediapipe} loading={loading === "mediapipe"} onClick={() => runTool("mediapipe")} />
          <ToolButton tool="classification" icon={<Tags className="h-5 w-5" />} remaining={currentUses.classification} loading={loading === "classification"} onClick={() => runTool("classification")} />
          <ToolButton tool="llm" icon={<Bot className="h-5 w-5" />} remaining={Number.POSITIVE_INFINITY} loading={loading === "llm"} onClick={() => runTool("llm")} />
          <ToolButton tool="imagegen" icon={<ImagePlus className="h-5 w-5" />} remaining={currentUses.imagegen} loading={loading === "imagegen"} onClick={() => runTool("imagegen")} />
        </div>

        <Separator className="bg-fuchsia-400/20" />

        <motion.div
          key={summary}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-4"
        >
          <p className="text-sm font-semibold leading-6 text-violet-100/76">{summary}</p>
        </motion.div>

        {sceneLabels.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">场景标签云</h3>
            <div className="flex flex-wrap gap-2">
              {sceneLabels.map((label) => (
                <Badge key={label.label} variant="cyan">
                  {label.label} {Math.round(label.confidence * 100)}%
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              {sceneLabels.map((label) => (
                <div key={label.label}>
                  <div className="mb-1 flex justify-between text-xs font-black text-white">
                    <span>{label.label}</span>
                    <span>{Math.round(label.confidence * 100)}%</span>
                  </div>
                  <Progress value={label.confidence * 100} />
                </div>
              ))}
            </div>
          </div>
        )}

        {timeline.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">动作时间轴</h3>
            <div className="space-y-2">
              {timeline.map((item) => (
                <div key={`${item.time}-${item.label}`} className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-3">
                  <div className="flex items-center justify-between text-sm font-black text-white">
                    <span>{item.label}</span>
                    <span>{Math.round(item.confidence * 100)}%</span>
                  </div>
                  <p className="text-xs font-semibold text-violet-100/60">T+{Math.round(item.time)}s</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reconstruction && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">视觉重建结果</h3>
            {reconstruction.imageUrl ? (
              <img
                src={reconstruction.imageUrl}
                alt="AI生成的案发过程视觉重建图"
                className="aspect-square w-full rounded-xl border border-fuchsia-400/20 object-cover"
              />
            ) : (
              <div className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-3 text-xs font-semibold leading-5 text-violet-100/72">
                图片接口不可用时保留提示词，可在演示报告中说明降级策略。
              </div>
            )}
            <p className="max-h-28 overflow-y-auto rounded-xl border border-fuchsia-400/20 bg-black/35 p-3 text-xs font-semibold leading-5 text-violet-100/72">
              {reconstruction.prompt}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ToolButton({
  tool,
  icon,
  remaining,
  loading,
  onClick,
}: {
  tool: AITool;
  icon: ReactNode;
  remaining: number;
  loading: boolean;
  onClick: () => void;
}) {
  const disabled = remaining <= 0 || loading;
  return (
    <Button
      data-tool={tool}
      variant="secondary"
      className="relative h-auto justify-start overflow-hidden rounded-xl border border-fuchsia-400/20 bg-black/35 p-4 text-left hover:bg-black/55"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${toolLabels[tool]} 剩余 ${Number.isFinite(remaining) ? remaining : "无限"} 次`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-fuchsia-400/30 bg-gradient-to-br from-[#ff184f] to-[#7c3aed] text-white">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-white">{toolLabels[tool]}</span>
        <span className="block whitespace-normal text-xs font-semibold leading-5 text-violet-100/66">{toolDescriptions[tool]}</span>
      </span>
      <Badge variant={remaining <= 0 ? "danger" : "outline"}>{Number.isFinite(remaining) ? remaining : "∞"}</Badge>
      {loading && <span className="absolute inset-0 rounded-xl border border-[#ff184f] animate-pulse" />}
    </Button>
  );
}
