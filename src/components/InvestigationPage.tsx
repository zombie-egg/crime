import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, FileText, Send, ShieldAlert, Target, UserRoundSearch, ListChecks } from "lucide-react";
import VideoAnalyzer from "@/components/VideoAnalyzer";
import AIToolbox from "@/components/AIToolbox";
import ClueNotebook from "@/components/ClueNotebook";
import DeductionDialog from "@/components/DeductionDialog";
import ChatAssistant from "@/components/ChatAssistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/store/gameStore";
import { formatTime } from "@/lib/utils";

export default function InvestigationPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const cases = useGameStore((state) => state.cases);
  const remainingTime = useGameStore((state) => state.remainingTime);
  const startCase = useGameStore((state) => state.startCase);
  const tickCase = useGameStore((state) => state.tickCase);
  const [currentTime, setCurrentTime] = useState(0);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const caseFile = useMemo(() => cases.find((item) => item.id === caseId), [cases, caseId]);

  useEffect(() => {
    if (!caseFile || !caseFile.unlocked) return;
    startCase(caseFile.id);
  }, [caseFile, startCase]);

  useEffect(() => {
    if (!caseFile || !caseFile.unlocked) return;
    const timer = window.setInterval(() => tickCase(caseFile.id), 1000);
    return () => window.clearInterval(timer);
  }, [caseFile, tickCase]);

  if (!caseId) return <Navigate to="/" replace />;
  if (!caseFile || !caseFile.unlocked) return <Navigate to="/" replace />;

  const timeLeft = remainingTime[caseFile.id] ?? caseFile.timeLimit;
  const foundCount = caseFile.clues.filter((clue) => clue.found).length;
  const hasDocumentContext = caseFile.clues.some((clue) => clue.found && (clue.aiTool === "llm" || clue.aiTool === "imagegen"));
  const canSubmit = (foundCount >= Math.ceil(caseFile.clues.length * 0.55) && hasDocumentContext) || timeLeft === 0;

  return (
    <div className="space-y-5">
      <section className="relative grid overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-white/5 shadow-[0_26px_80px_rgba(0,0,0,0.48)] lg:grid-cols-[1fr_320px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,24,79,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(174,56,255,0.12),transparent_36%)]" />
        <div className="relative border-b border-fuchsia-400/20 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <Badge variant="outline">{difficultyLabel(caseFile.difficulty)}</Badge>
            <Badge variant={timeLeft < 60 ? "danger" : "secondary"} className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="cyan">线索 {foundCount}/{caseFile.clues.length}</Badge>
          </div>
          <h1 className="text-4xl font-black leading-tight text-white md:text-5xl neon-text">{caseFile.title}</h1>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-violet-100/72">{caseFile.description}</p>
        </div>
        <div className="relative grid grid-rows-[1fr_auto]">
          <div className="space-y-3 p-5">
            <p className="text-sm font-black uppercase tracking-wider text-violet-200/55">Case Timer</p>
            <Progress value={(timeLeft / caseFile.timeLimit) * 100} />
            <p className="text-4xl font-black text-white">{formatTime(timeLeft)}</p>
          </div>
          <div className="border-t border-fuchsia-400/20 p-5">
            <Button disabled={!canSubmit} onClick={() => setDeductionOpen(true)} className="w-full">
              <Send className="h-4 w-4" />
              提交推理
            </Button>
            {!canSubmit && (
              <p className="mt-3 text-xs font-bold leading-5 text-violet-100/70">
                需要先收集足够线索，并使用 AI 助手或视觉重建器补全档案证据链。
              </p>
            )}
          </div>
        </div>
      </section>

      {timeLeft === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-600/25 p-3 text-sm font-black text-red-50"
        >
          <ShieldAlert className="h-4 w-4" />
          倒计时结束，仍可提交已有推理，但时间效率将归零。
        </motion.div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-white">
            <FileText className="h-5 w-5" />
            案件背景档案
          </div>
          <p className="text-sm font-semibold leading-7 text-violet-100/75">{caseFile.briefing}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {caseFile.knownFacts.map((fact, index) => (
              <div key={fact} className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-3">
                <p className="mb-1 text-xs font-black text-[#ff184f]">已知事实 {index + 1}</p>
                <p className="text-sm font-bold leading-6 text-white">{fact}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-white">
            <Target className="h-5 w-5" />
            调查目标
          </div>
          <p className="text-sm font-bold leading-7 text-violet-50">{caseFile.investigationGoal}</p>
          <div className="mt-4 space-y-2">
            {caseFile.timeline.map((item) => (
              <div key={`${item.time}-${item.event}`} className="grid grid-cols-[72px_1fr] overflow-hidden rounded-lg border border-fuchsia-400/20 bg-black/35">
                <div className="border-r border-fuchsia-400/20 bg-gradient-to-br from-[#ff184f] to-[#7c3aed] p-2 text-xs font-black text-white">
                  {item.time}
                </div>
                <div className="p-2 text-xs font-bold leading-5 text-violet-50">{item.event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-white">
            <UserRoundSearch className="h-5 w-5" />
            嫌疑人档案
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {caseFile.suspects.map((suspect) => (
              <div key={suspect.id} className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black text-white">{suspect.name}</p>
                    <p className="text-xs font-black uppercase text-[#ff184f]">{suspect.role ?? "嫌疑人"}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-fuchsia-400/30 bg-gradient-to-br from-[#ff184f] to-[#7c3aed] text-sm font-black text-white">
                    {suspect.avatar}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-6 text-violet-100/72">{suspect.description}</p>
                <div className="mt-3 space-y-2 text-xs font-semibold leading-5 text-violet-50">
                  <p><span className="font-black text-white">权限：</span>{suspect.access}</p>
                  <p><span className="font-black text-white">动机：</span>{suspect.motive}</p>
                  <p><span className="font-black text-white">不在场：</span>{suspect.alibi}</p>
                  <p><span className="font-black text-white">矛盾点：</span>{suspect.contradiction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-white">
            <ListChecks className="h-5 w-5" />
            可提交证据
          </div>
          <div className="space-y-3">
            {caseFile.evidenceOptions.map((evidence) => (
              <div key={evidence.id} className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-3">
                <p className="text-sm font-black text-white">{evidence.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-violet-100/68">{evidence.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <VideoAnalyzer caseFile={caseFile} currentTime={currentTime} onTimeChange={setCurrentTime} />
        <AIToolbox caseFile={caseFile} currentTime={currentTime} />
      </section>
      <ClueNotebook caseFile={caseFile} />
      <ChatAssistant caseFile={caseFile} />
      <DeductionDialog
        caseFile={caseFile}
        open={deductionOpen}
        onOpenChange={setDeductionOpen}
        onSubmitted={() => navigate(`/result/${caseFile.id}`)}
      />
    </div>
  );
}

function difficultyLabel(difficulty: string) {
  return difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难";
}
