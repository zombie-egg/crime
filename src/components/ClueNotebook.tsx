import { motion } from "framer-motion";
import { ClipboardList, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime } from "@/lib/utils";
import type { Case } from "@/types/game";

export default function ClueNotebook({ caseFile }: { caseFile: Case }) {
  const found = caseFile.clues.filter((clue) => clue.found);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b-4 border-black bg-[#e60012] text-white">
        <CardTitle className="flex items-center gap-2 text-white">
          <ClipboardList className="h-5 w-5" />
          线索记录本
        </CardTitle>
        <Badge variant="secondary">{found.length}/{caseFile.clues.length}</Badge>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {caseFile.clues.map((clue, index) => (
            <motion.div
              key={clue.id}
              data-clue-id={clue.id}
              initial={false}
              animate={{ rotateY: clue.found ? 0 : 180, opacity: 1 }}
              transition={{ duration: 0.46, delay: clue.found ? index * 0.03 : 0 }}
              className={`min-h-[150px] border-4 border-black p-4 [transform-style:preserve-3d] ${
                clue.found ? "bg-white" : "bg-[#f7f3e8]"
              }`}
            >
              {clue.found ? (
                <div className="space-y-3 [backface-visibility:hidden]">
                  <div className="flex items-start gap-3">
                    <Checkbox checked aria-label="已发现线索" />
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariant(clue.type)}>{typeLabel(clue.type)}</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatTime(clue.timestamp)}
                        </Badge>
                      </div>
                      <p className="text-sm font-black leading-6 text-black">{clue.description}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold leading-5 text-neutral-600">
                    {clue.evidence ?? "证据已记录，等待交叉验证。"}
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[114px] flex-col items-center justify-center border-4 border-dashed border-black bg-white text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-sm font-black text-black">未解锁线索</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-600">使用 {toolLabel(clue.aiTool)} 分析关键帧</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function typeLabel(type: Case["clues"][number]["type"]) {
  return type === "object" ? "物体" : type === "pose" ? "姿态" : type === "scene" ? "场景" : "文档";
}

function toolLabel(tool: Case["clues"][number]["aiTool"]) {
  if (tool === "yolo") return "物体检测器";
  if (tool === "mediapipe") return "姿态分析器";
  if (tool === "classification") return "场景识别器";
  if (tool === "imagegen") return "视觉重建器";
  return "AI助手";
}

function badgeVariant(type: Case["clues"][number]["type"]) {
  return type === "object" ? "outline" : type === "pose" ? "cyan" : type === "scene" ? "secondary" : "default";
}
