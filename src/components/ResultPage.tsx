import { useMemo, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, RotateCcw, Share2, Star, Trophy } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/gameStore";
import type { ScoreBreakdown } from "@/types/game";

export default function ResultPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const shareRef = useRef<HTMLDivElement>(null);
  const { cases, latestScore, resultCaseId, resetCase } = useGameStore();
  const caseFile = cases.find((item) => item.id === caseId);
  const score = resultCaseId === caseId ? latestScore : undefined;
  const nextCase = useMemo(() => {
    const index = cases.findIndex((item) => item.id === caseId);
    return cases[index + 1];
  }, [cases, caseId]);

  if (!caseFile || !score) return <Navigate to="/" replace />;

  const radarData = [
    { subject: "线索完整度", score: score.clueCompleteness },
    { subject: "推理准确度", score: score.deductionAccuracy },
    { subject: "时间效率", score: score.timeEfficiency },
    { subject: "工具效率", score: score.toolEfficiency },
  ];

  const share = async () => {
    const text = `我在《霓虹疑案》中以 ${score.total} 分、${score.stars} 星完成「${caseFile.title}」。`;
    if (navigator.share) {
      await navigator.share({ title: "霓虹疑案成绩", text }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(text).catch(() => undefined);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.92, 1.04, 1] }}
        transition={{ duration: 0.7 }}
        className="pointer-events-none fixed inset-0 z-50 bg-[#ffd500]"
      />
      <section ref={shareRef} className="border-4 border-black bg-white p-6 shadow-[10px_10px_0_#111]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              {rankLabel(score.rank)}
            </Badge>
            <h1 className="text-3xl font-black text-black md:text-5xl">{caseFile.title}</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-neutral-700">{caseFile.endingTexts[score.rank]}</p>
          </div>
          <div className="border-4 border-black bg-[#ffd500] p-5 text-center shadow-[8px_8px_0_#111]">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-black" />
            <p className="text-sm font-black text-black">总分</p>
            <p className="text-5xl font-black text-black">{score.total}</p>
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < score.stars ? "fill-black text-black" : "text-black/40"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>维度评分</CardTitle>
            <CardDescription>雷达图展示线索、推理、时间和工具效率。</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="black" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#111", fontSize: 12, fontWeight: 700 }} />
                <Radar dataKey="score" stroke="#0057b8" fill="#e60012" fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI导演评语</CardTitle>
            <CardDescription>根据本次推理结果生成的结案评价。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="border-4 border-black bg-white p-4 text-sm font-semibold leading-7 text-neutral-700">
              {score.directorComment}
            </p>
            <ScoreLine label="线索完整度" value={score.clueCompleteness} />
            <ScoreLine label="推理准确度" value={score.deductionAccuracy} />
            <ScoreLine label="时间效率" value={score.timeEfficiency} />
            <ScoreLine label="工具效率" value={score.toolEfficiency} />
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={share}>
          <Share2 className="h-4 w-4" />
          分享成绩
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetCase(caseFile.id);
            navigate(`/case/${caseFile.id}`);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          重新挑战
        </Button>
        <Button variant="secondary" onClick={() => navigate("/")}>
          <Download className="h-4 w-4" />
          返回办公室
        </Button>
        {nextCase?.unlocked && <Button onClick={() => navigate(`/case/${nextCase.id}`)}>下一案件</Button>}
      </div>
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-neutral-700">{label}</span>
        <span className="font-black text-black">{value}</span>
      </div>
      <div className="h-4 overflow-hidden border-4 border-black bg-white">
        <div className="h-full bg-[#e60012]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function rankLabel(rank: ScoreBreakdown["rank"]) {
  return rank === "perfect" ? "完美破案" : rank === "good" ? "良好结案" : "普通结案";
}
