import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronDown, Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/ai/analyzers";
import { useGameStore } from "@/store/gameStore";
import type { Case } from "@/types/game";

export default function ChatAssistant({ caseFile }: { caseFile: Case }) {
  const { chatMessages, addChatMessage } = useGameStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messages = chatMessages[caseFile.id] ?? [];
  const foundClues = useMemo(() => caseFile.clues.filter((clue) => clue.found).map((clue) => clue.description), [caseFile.clues]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    addChatMessage(caseFile.id, { role: "user", content: question });
    setLoading(true);
    const answer = await askAssistant(question, caseFile, foundClues);
    addChatMessage(caseFile.id, { role: "assistant", content: answer });
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[390px]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="mb-3 overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[#0b0714]/95 shadow-[0_26px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-fuchsia-400/20 bg-black/50 p-3 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-fuchsia-400/30 bg-gradient-to-br from-[#ff184f] to-[#7c3aed] text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black">AI 导演助手</p>
                  <p className="text-xs font-semibold text-violet-100/65">本地代理 / OpenAI 中转</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="折叠助手">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[360px] space-y-3 overflow-y-auto p-3">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-xl border border-fuchsia-400/20 px-3 py-2 text-sm font-semibold leading-6 ${
                      message.role === "user" ? "bg-[#ff184f]/18 text-white" : "bg-black/35 text-violet-50"
                    }`}
                  >
                    <TypewriterText text={message.content} active={message.role === "assistant" && index === messages.length - 1} />
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI 正在整理线索
                </div>
              )}
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-fuchsia-400/20 p-3">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="询问线索关系或推理建议"
                aria-label="向 AI 助手提问"
              />
              <Button size="icon" type="submit" disabled={loading || !input.trim()} aria-label="发送">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <Button className="ml-auto flex" onClick={() => setOpen((value) => !value)}>
        <MessageSquare className="h-4 w-4" />
        AI助手
      </Button>
    </div>
  );
}

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [visible, setVisible] = useState(active ? 0 : text.length);

  useEffect(() => {
    if (!active) {
      setVisible(text.length);
      return;
    }
    setVisible(0);
    const timer = window.setInterval(() => {
      setVisible((current) => {
        if (current >= text.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 18);
    return () => window.clearInterval(timer);
  }, [active, text]);

  return <span>{active ? text.slice(0, visible) : text}</span>;
}
