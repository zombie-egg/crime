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
      <section className="grid overflow-hidden border-4 border-black bg-white shadow-[10px_10px_0_#111] lg:grid-cols-[1fr_320px]">
        <div className="border-b-4 border-black p-5 lg:border-b-0 lg:border-r-4">
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
          <h1 className="text-4xl font-black leading-tight text-black md:text-5xl">{caseFile.title}</h1>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-neutral-700">{caseFile.description}</p>
        </div>
        <div className="grid grid-rows-[1fr_auto]">
          <div className="space-y-3 p-5">
            <p className="text-sm font-black uppercase text-neutral-600">Case Timer</p>
            <Progress value={(timeLeft / caseFile.timeLimit) * 100} />
            <p className="text-4xl font-black text-black">{formatTime(timeLeft)}</p>
          </div>
          <div className="border-t-4 border-black p-5">
            <Button disabled={!canSubmit} onClick={() => setDeductionOpen(true)} className="w-full">
              <Send className="h-4 w-4" />
              提交推理
            </Button>
            {!canSubmit && (
              <p className="mt-3 text-xs font-bold leading-5 text-neutral-700">
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
          className="flex items-center gap-2 border-4 border-black bg-[#e60012] p-3 text-sm font-black text-white"
        >
          <ShieldAlert className="h-4 w-4" />
          倒计时结束，仍可提交已有推理，但时间效率将归零。
        </motion.div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_#111]">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-black">
            <FileText className="h-5 w-5" />
            案件背景档案
          </div>
          <p className="text-sm font-semibold leading-7 text-neutral-700">{caseFile.briefing}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {caseFile.knownFacts.map((fact, index) => (
              <div key={fact} className="border-4 border-black bg-[#f7f3e8] p-3">
                <p className="mb-1 text-xs font-black text-[#0057b8]">已知事实 {index + 1}</p>
                <p className="text-sm font-bold leading-6 text-black">{fact}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-4 border-black bg-[#ffd500] p-5 shadow-[8px_8px_0_#111]">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-black">
            <Target className="h-5 w-5" />
            调查目标
          </div>
          <p className="text-sm font-bold leading-7 text-black">{caseFile.investigationGoal}</p>
          <div className="mt-4 space-y-2">
            {caseFile.timeline.map((item) => (
              <div key={`${item.time}-${item.event}`} className="grid grid-cols-[72px_1fr] border-4 border-black bg-white">
                <div className="border-r-4 border-black bg-[#0057b8] p-2 text-xs font-black text-white">{item.time}</div>
                <div className="p-2 text-xs font-bold leading-5 text-black">{item.event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_#111]">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-black">
            <UserRoundSearch className="h-5 w-5" />
            嫌疑人档案
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {caseFile.suspects.map((suspect) => (
              <div key={suspect.id} className="border-4 border-black bg-[#f7f3e8] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black text-black">{suspect.name}</p>
                    <p className="text-xs font-black uppercase text-[#0057b8]">{suspect.role ?? "嫌疑人"}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#ffd500] text-sm font-black text-black">
                    {suspect.avatar}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-6 text-neutral-700">{suspect.description}</p>
                <div className="mt-3 space-y-2 text-xs font-semibold leading-5 text-black">
                  <p><span className="font-black">权限：</span>{suspect.access}</p>
                  <p><span className="font-black">动机：</span>{suspect.motive}</p>
                  <p><span className="font-black">不在场：</span>{suspect.alibi}</p>
                  <p><span className="font-black">矛盾点：</span>{suspect.contradiction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-4 border-black bg-[#f7f3e8] p-5 shadow-[8px_8px_0_#111]">
          <div className="mb-3 flex items-center gap-2 text-lg font-black text-black">
            <ListChecks className="h-5 w-5" />
            可提交证据
          </div>
          <div className="space-y-3">
            {caseFile.evidenceOptions.map((evidence) => (
              <div key={evidence.id} className="border-4 border-black bg-white p-3">
                <p className="text-sm font-black text-black">{evidence.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-700">{evidence.description}</p>
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
