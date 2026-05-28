import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Languages, Moon, Sun, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/store/gameStore";

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, locale, toggleLocale, leaderboard } = useGameStore();

  return (
    <div className={`${theme} min-h-screen bg-background text-foreground`}>
      <div className="fixed inset-0 -z-10 maze-paper opacity-60" />
      <div className="fixed inset-0 -z-10 horror-vignette" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,24,79,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(174,56,255,0.12),transparent_28%)]" />
      <header className="sticky top-0 z-40 border-b border-fuchsia-500/30 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6">
          <button
            type="button"
            className="group flex items-stretch overflow-hidden rounded-md border border-fuchsia-400/40 bg-white/5 text-left shadow-[0_0_28px_rgba(255,24,79,0.12)] transition-transform hover:-translate-y-0.5"
            onClick={() => navigate("/")}
            aria-label="返回首页"
          >
            <span className="flex h-12 w-14 items-center justify-center border-r border-fuchsia-400/40 bg-gradient-to-br from-[#ff184f] to-[#7c3aed] text-lg font-black text-white">
              ND
            </span>
            <span className="flex flex-col justify-center px-3 py-1">
              <span className="block text-sm font-black uppercase tracking-wide text-white">Neon Detective</span>
              <span className="block text-xs font-semibold text-violet-200/70">horror case interface</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden gap-1 sm:flex">
              <Trophy className="h-3.5 w-3.5" />
              本地榜 {leaderboard.length}
            </Badge>
            <Button variant="ghost" size="icon" aria-label="切换语言" onClick={toggleLocale} title="切换语言">
              <Languages className="h-4 w-4" />
              <span className="sr-only">{locale}</span>
            </Button>
            <Button variant="ghost" size="icon" aria-label="切换主题" onClick={toggleTheme} title="切换主题">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" aria-label="首页" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.99 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto max-w-[1440px] px-4 py-5 md:px-6"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
