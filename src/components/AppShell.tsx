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
      <div className="fixed inset-0 -z-10 bg-[#f7f3e8]" />
      <div className="fixed inset-0 -z-10 mondrian-paper opacity-80" />
      <header className="sticky top-0 z-40 border-b-4 border-black bg-[#f7f3e8]">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6">
          <button
            type="button"
            className="group flex items-stretch border-4 border-black bg-white text-left shadow-[6px_6px_0_#111] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd500]"
            onClick={() => navigate("/")}
            aria-label="返回首页"
          >
            <span className="flex h-12 w-14 items-center justify-center border-r-4 border-black bg-[#e60012] text-lg font-black text-white">
              ND
            </span>
            <span className="flex flex-col justify-center px-3">
              <span className="block text-sm font-black uppercase tracking-wide text-black">Neon Detective</span>
              <span className="block text-xs font-bold text-neutral-600">AI Case Lab</span>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto max-w-[1440px] px-4 py-5 md:px-6"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
