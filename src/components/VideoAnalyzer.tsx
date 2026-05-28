import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, RotateCw, Repeat, ScanLine, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/store/gameStore";
import { formatTime } from "@/lib/utils";
import type { Case, DetectionBox, PoseResult } from "@/types/game";

interface VideoAnalyzerProps {
  caseFile: Case;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export default function VideoAnalyzer({ caseFile, currentTime, onTimeChange }: VideoAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(120);
  const [loop, setLoop] = useState(true);
  const [scanPulse, setScanPulse] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const overlayCase = useGameStore((state) => state.cases.find((item) => item.id === caseFile.id));
  const activeDetections = useMemo(
    () =>
      overlayCase?.clues
        .filter((clue) => clue.found && clue.aiTool === "yolo")
        .map((clue, index) => ({
        id: `box-${clue.id}`,
        label: labelFromClueId(clue.id),
        confidence: clue.confidence ?? 0.82,
        x: 16 + index * 30,
        y: 28 + index * 12,
        width: 22,
        height: 20,
        clueId: clue.id,
        })) ?? [],
    [overlayCase],
  );
  const activePose = useMemo(
    () => overlayCase?.clues.some((clue) => clue.found && clue.aiTool === "mediapipe") ?? false,
    [overlayCase],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => onTimeChange(video.currentTime);
    const setMeta = () => setDuration(video.duration || 120);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("timeupdate", sync);
    video.addEventListener("loadedmetadata", setMeta);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("loadedmetadata", setMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [onTimeChange]);

  useEffect(() => {
    if (!fallbackMode || !playing) return;
    const timer = window.setInterval(() => {
      onTimeChange(Math.min(duration, currentTime + 0.25));
    }, 250);
    return () => window.clearInterval(timer);
  }, [currentTime, duration, fallbackMode, onTimeChange, playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const holder = canvas?.parentElement;
    if (!canvas || !holder) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const rect = holder.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      drawDetectionBoxes(context, activeDetections, rect.width, rect.height);
      if (activePose) drawPose(context, rect.width, rect.height);
    };

    draw();
    const animation = window.setInterval(draw, 140);
    window.addEventListener("resize", draw);
    return () => {
      window.clearInterval(animation);
      window.removeEventListener("resize", draw);
    };
  }, [activeDetections, activePose]);

  useEffect(() => {
    if (!activeDetections.length && !activePose) return;
    setScanPulse(true);
    const timer = window.setTimeout(() => setScanPulse(false), 760);
    return () => window.clearTimeout(timer);
  }, [activeDetections.length, activePose]);

  const jump = (offset: number) => {
    const next = Math.min(Math.max(currentTime + offset, 0), duration || 120);
    const video = videoRef.current;
    if (video && !fallbackMode) video.currentTime = next;
    onTimeChange(next);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || fallbackMode) {
      setPlaying((value) => !value);
      return;
    }
    if (video.paused) {
      await video.play().catch(() => setFallbackMode(true));
    } else {
      video.pause();
    }
  };

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0_#111]">
      <div className="flex items-center justify-between border-b-4 border-black bg-[#0057b8] p-3 text-white">
        <div className="flex items-center gap-2 font-black">
          <ScanLine className="h-5 w-5" />
          视频分析区
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">AI Overlay</Badge>
          {loop && <Badge variant="default">循环</Badge>}
        </div>
      </div>
      <div className="relative aspect-video overflow-hidden bg-black scanlines">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${fallbackMode ? "hidden" : ""}`}
          src={caseFile.videoUrl}
          loop={loop}
          muted
          playsInline
          preload="metadata"
          poster="/assets/video-poster.svg"
          aria-label={`${caseFile.title} 案件视频`}
          onError={() => setFallbackMode(true)}
        />
        {fallbackMode && <FallbackScene caseId={caseFile.id} currentTime={currentTime} onTimeChange={onTimeChange} />}
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[72%] border-4 border-black bg-white/95 p-2 text-xs font-black leading-5 text-black shadow-[4px_4px_0_#111]">
          监控改编片段：请结合案情档案、AI 标注和线索本推理，不把原始素材当作唯一证据。
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 border-4 border-black bg-[#ffd500] px-3 py-2 text-xs font-black text-black shadow-[4px_4px_0_#111]">
          当前帧 T+{Math.round(currentTime)}s
        </div>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
        <AnimatePresence>
          {scanPulse && (
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-48 w-48 rounded-full border-4 border-[#ffd500]"
              initial={{ x: "-50%", y: "-50%", scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 3.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.78, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3 border-t-4 border-black p-4">
        {caseFile.videoCredit && (
          <div className="border-4 border-black bg-[#f7f3e8] p-3 text-xs font-semibold leading-5 text-neutral-700">
            真实视频素材改编：{caseFile.videoCredit.title} / {caseFile.videoCredit.source} / {caseFile.videoCredit.license}
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs font-black tabular-nums text-black">{formatTime(currentTime)}</span>
          <input
            className="h-3 min-w-0 flex-1 cursor-pointer appearance-none border-4 border-black bg-white accent-[#e60012]"
            type="range"
            min={0}
            max={duration || 120}
            value={currentTime}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (videoRef.current && !fallbackMode) videoRef.current.currentTime = next;
              onTimeChange(next);
            }}
            aria-label="视频进度"
          />
          <span className="w-12 text-right text-xs font-black tabular-nums text-black">{formatTime(duration || 120)}</span>
        </div>
        <Progress value={((currentTime || 0) / (duration || 120)) * 100} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => jump(-10)} aria-label="后退10秒">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlay} aria-label={playing ? "暂停" : "播放"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="icon" onClick={() => jump(10)} aria-label="前进10秒">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => jump(-3)} aria-label="后退3秒">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => jump(3)} aria-label="前进3秒">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <Button variant={loop ? "outline" : "secondary"} size="sm" onClick={() => setLoop((value) => !value)}>
            <Repeat className="h-4 w-4" />
            循环
          </Button>
        </div>
      </div>
    </div>
  );
}

function FallbackScene({
  caseId,
  currentTime,
  onTimeChange,
}: {
  caseId: string;
  currentTime: number;
  onTimeChange: (time: number) => void;
}) {
  const scene = {
    "museum-shadow": { title: "市立博物馆 / 展厅 3", subject: "展柜", accent: "怀表" },
    "rainy-alley": { title: "旧影院后巷 / 暴雨", subject: "雨伞", accent: "胶片盒" },
    "harbor-signal": { title: "东港货仓 / 凌晨", subject: "叉车", accent: "红灯讯号" },
  }[caseId] ?? { title: "监控录像", subject: "现场", accent: "证据" };

  return (
    <button
      type="button"
      className="absolute inset-0 z-[1] grid grid-cols-[1fr_1.2fr_.7fr] bg-white text-left"
      onClick={(event) => {
        const target = event.currentTarget.getBoundingClientRect();
        const ratio = event.nativeEvent.offsetX / target.width;
        onTimeChange(Math.max(0, Math.min(120, ratio * 120)));
      }}
      aria-label="模拟案件录像画面"
    >
      <div className="border-r-4 border-black bg-[#ffd500]" />
      <div className="relative flex items-center justify-center border-r-4 border-black bg-[#f7f3e8]">
        <motion.div
          className="absolute bottom-[18%] h-28 w-20 border-4 border-black bg-[#0057b8]"
          animate={{ x: [-120, 120, -120] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10 border-4 border-black bg-white p-5 shadow-[8px_8px_0_#111]">
          <p className="text-xs font-black uppercase text-neutral-600">{scene.title}</p>
          <p className="mt-2 text-3xl font-black text-black">{scene.subject}</p>
          <p className="mt-1 text-sm font-bold text-neutral-700">{scene.accent} / T+{Math.round(currentTime)}s</p>
        </div>
      </div>
      <div className="grid grid-rows-[1fr_1fr]">
        <div className="border-b-4 border-black bg-[#e60012]" />
        <div className="bg-black" />
      </div>
    </button>
  );
}

function drawDetectionBoxes(
  context: CanvasRenderingContext2D,
  detections: DetectionBox[],
  width: number,
  height: number,
) {
  detections.forEach((box) => {
    const x = (box.x / 100) * width;
    const y = (box.y / 100) * height;
    const w = (box.width / 100) * width;
    const h = (box.height / 100) * height;
    context.save();
    context.strokeStyle = "#ffd500";
    context.lineWidth = 4;
    context.strokeRect(x, y, w, h);
    context.fillStyle = "#111";
    context.fillRect(x, y - 30, Math.max(148, w), 28);
    context.fillStyle = "#ffd500";
    context.font = "bold 13px Inter, sans-serif";
    context.fillText(`${box.label} ${Math.round(box.confidence * 100)}%`, x + 8, y - 11);
    context.restore();
  });
}

function drawPose(context: CanvasRenderingContext2D, width: number, height: number) {
  const pose: PoseResult["keypoints"] = [
    { x: 48, y: 22, score: 0.94 },
    { x: 45, y: 36, score: 0.9 },
    { x: 55, y: 36, score: 0.9 },
    { x: 40, y: 53, score: 0.86 },
    { x: 61, y: 55, score: 0.85 },
    { x: 42, y: 72, score: 0.8 },
    { x: 58, y: 72, score: 0.79 },
  ];
  const lines = [[0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6], [5, 6]];
  context.save();
  context.lineWidth = 4;
  lines.forEach(([from, to]) => {
    const a = pose[from];
    const b = pose[to];
    context.strokeStyle = "#0057b8";
    context.beginPath();
    context.moveTo((a.x / 100) * width, (a.y / 100) * height);
    context.lineTo((b.x / 100) * width, (b.y / 100) * height);
    context.stroke();
  });
  pose.forEach((point) => {
    context.fillStyle = "#e60012";
    context.beginPath();
    context.arc((point.x / 100) * width, (point.y / 100) * height, 5, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
}

function labelFromClueId(clueId: string) {
  if (clueId.includes("glove")) return "black glove";
  if (clueId.includes("crowbar")) return "crowbar";
  if (clueId.includes("umbrella")) return "umbrella";
  if (clueId.includes("filmcase")) return "film case";
  if (clueId.includes("laser")) return "laser";
  if (clueId.includes("case")) return "case";
  return "evidence";
}
