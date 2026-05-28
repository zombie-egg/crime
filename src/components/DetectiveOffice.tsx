import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, BarChart3, CheckCircle2, Lock, Play, Star, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useGameStore } from "@/store/gameStore";
import type { Case } from "@/types/game";

export default function DetectiveOffice() {
  const navigate = useNavigate();
  const { cases, playerLevel, achievements, leaderboard } = useGameStore();
  const completed = cases.filter((item) => item.completed).length;
  const solveRate = Math.round((completed / cases.length) * 100);

  return (
    <div className="space-y-6">
      <section className="grid overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.45fr_.75fr_.36fr]">
        <div className="relative flex flex-col justify-between border-b border-fuchsia-400/20 p-6 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,24,79,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(174,56,255,0.14),transparent_38%)]" />
          <div className="relative">
            <Badge variant="danger" className="mb-5">
              Nightmare Control Room
            </Badge>
            <h1 className="max-w-4xl text-4xl font-black leading-[0.94] tracking-normal text-white md:text-6xl neon-text">
              在黑暗迷宫里追踪每一条活着的线索
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-violet-100/75">
              进入案件，分析视频中的异常，把物体、姿态、场景和文档线索串成一条能闭合的证据链。
            </p>
          </div>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="玩家等级" value={`Lv.${playerLevel}`} icon={<Award className="h-5 w-5" />} tone="red" />
            <Stat label="破案率" value={`${solveRate}%`} icon={<BarChart3 className="h-5 w-5" />} tone="purple" />
            <Stat
              label="已解锁"
              value={`${cases.filter((item) => item.unlocked).length}/${cases.length}`}
              icon={<Users className="h-5 w-5" />}
              tone="amber"
            />
          </div>
        </div>
        <div className="grid grid-rows-[1fr_auto] border-b border-fuchsia-400/20 lg:border-b-0 lg:border-r">
          <Card className="border-0 bg-white/0 shadow-none">
            <CardHeader>
              <CardTitle className="text-white">调查档案</CardTitle>
              <CardDescription>本地保存成就、排行榜和案件进度。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-black text-white">
                  <span>案件进度</span>
                  <span>
                    {completed}/{cases.length}
                  </span>
                </div>
                <Progress value={solveRate} />
              </div>
              <Separator className="bg-fuchsia-400/20" />
              <div className="space-y-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-3 rounded-md border border-fuchsia-400/20 bg-black/35 p-3">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 ${achievement.unlocked ? "text-[#ff184f]" : "text-violet-300/40"}`} />
                    <div>
                      <p className="text-sm font-black text-white">{achievement.label}</p>
                      <p className="text-xs font-semibold leading-5 text-violet-100/65">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {leaderboard.length > 0 && (
                <>
                  <Separator className="bg-fuchsia-400/20" />
                  <div className="space-y-2">
                    {leaderboard.slice(0, 3).map((score) => (
                      <div key={score.id} className="flex items-center justify-between text-sm font-black text-white">
                        <span className="truncate">{score.caseTitle}</span>
                        <span>{score.total}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 border-t border-fuchsia-400/20">
            <div className="h-16 bg-gradient-to-br from-[#ff184f] to-[#7c3aed]" />
            <div className="h-16 bg-gradient-to-br from-[#ffd166] to-[#ff184f]" />
            <div className="h-16 bg-gradient-to-br from-[#1d4ed8] to-[#7c3aed]" />
          </div>
        </div>
        <div className="hidden grid-rows-[1.2fr_.8fr_1fr] lg:grid">
          <div className="border-b border-fuchsia-400/20 bg-[radial-gradient(circle_at_top,rgba(255,24,79,0.16),transparent_64%)]" />
          <div className="border-b border-fuchsia-400/20 bg-[radial-gradient(circle_at_center,rgba(174,56,255,0.08),transparent_60%)]" />
          <div className="bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_55%)]" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cases.map((caseFile, index) => (
          <CaseCard key={caseFile.id} caseFile={caseFile} index={index} navigate={navigate} />
        ))}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "red" | "purple" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "bg-gradient-to-br from-[#ff184f] to-[#7c3aed] text-white"
      : tone === "amber"
        ? "bg-gradient-to-br from-[#f59e0b] to-[#ff184f] text-white"
        : "bg-gradient-to-br from-[#7c3aed] to-[#ff4fd8] text-white";
  return (
    <div className="grid grid-cols-[52px_1fr] overflow-hidden rounded-xl border border-fuchsia-400/20 bg-black/35">
      <div className={`flex items-center justify-center ${toneClass}`}>{icon}</div>
      <div className="p-3">
        <p className="text-xs font-black uppercase text-violet-200/55">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function CaseCard({
  caseFile,
  index,
  navigate,
}: {
  caseFile: Case;
  index: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const status = caseFile.completed ? "已完成" : caseFile.unlocked ? "已解锁" : "未解锁";

  const openCase = () => {
    if (!caseFile.unlocked) return;
    navigate(`/case/${caseFile.id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={caseFile.unlocked ? { y: -4 } : undefined}
      className={`relative grid min-h-[430px] grid-rows-[1fr_auto] overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-white/5 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ${
        caseFile.unlocked ? "" : "opacity-55"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,24,79,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(174,56,255,0.14),transparent_36%)]" />
      <div className="relative flex flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Badge variant={caseFile.completed ? "default" : caseFile.unlocked ? "cyan" : "secondary"}>{status}</Badge>
          <Badge variant="outline">{difficultyLabel(caseFile.difficulty)}</Badge>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black leading-tight text-white neon-text">{caseFile.title}</h2>
          <p className="min-h-[96px] text-base font-semibold leading-7 text-violet-100/70">{caseFile.description}</p>
        </div>
        <div className="mt-auto space-y-4 pt-6">
          <div className="flex items-center gap-1" aria-label={`星级 ${caseFile.stars}`}>
            {Array.from({ length: 5 }).map((_, star) => (
              <Star
                key={star}
                className={`h-5 w-5 stroke-[2.5] ${star < caseFile.stars ? "fill-[#ff184f] text-[#ff184f]" : "text-violet-300/30"}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{caseFile.clues.length} 条线索</Badge>
            <Badge variant="secondary">{caseFile.suspects.length} 名嫌疑人</Badge>
            <Badge variant="secondary">{Math.round(caseFile.timeLimit / 60)} 分钟</Badge>
          </div>
        </div>
      </div>
      <div className="relative border-t border-fuchsia-400/20 p-4">
        <Button
          type="button"
          disabled={!caseFile.unlocked}
          onClick={openCase}
          className="h-14 w-full text-lg"
          data-case-open={caseFile.id}
          aria-label={caseFile.unlocked ? `进入案件 ${caseFile.title}` : "案件未解锁"}
        >
          {caseFile.unlocked ? <Play className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          {caseFile.unlocked ? (caseFile.completed ? "重新调查" : "进入案件") : "完成前案解锁"}
        </Button>
      </div>
    </motion.article>
  );
}

function difficultyLabel(difficulty: Case["difficulty"]) {
  return difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难";
}
