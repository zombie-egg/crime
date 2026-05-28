import { FormEvent, useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { answerToolOptions } from "@/data/cases";
import { playSound } from "@/lib/audio";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Case } from "@/types/game";

interface DeductionDialogProps {
  caseFile: Case;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export default function DeductionDialog({ caseFile, open, onOpenChange, onSubmitted }: DeductionDialogProps) {
  const submitDeduction = useGameStore((state) => state.submitDeduction);
  const [culprit, setCulprit] = useState(caseFile.suspects[0]?.id ?? "");
  const [tools, setTools] = useState<string[]>([]);
  const [motive, setMotive] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    submitDeduction(caseFile.id, { culprit, tools, motive });
    playSound("success");
    onOpenChange(false);
    onSubmitted();
  };

  const toggleTool = (toolId: string) => {
    setTools((current) => (current.includes(toolId) ? current.filter((item) => item !== toolId) : [...current, toolId]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-fuchsia-400/20 bg-[#0b0714]/96 p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
        <DialogHeader className="border-b border-fuchsia-400/20 bg-black/55 p-5 pr-16">
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <CheckCircle2 className="h-6 w-6 text-[#ff184f]" />
            提交最终推理
          </DialogTitle>
          <DialogDescription className="text-violet-100/72">
            先核对嫌疑人档案和证据链，再提交犯人、工具和动机。答案将结合线索完整度、工具效率、剩余时间和推理准确度评分。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="space-y-6 p-5">
            <section className="rounded-xl border border-fuchsia-400/20 bg-black/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-white">
                <FileText className="h-4 w-4 text-[#ff184f]" />
                你已解锁的证据
              </div>
              <div className="flex flex-wrap gap-2">
                {caseFile.clues
                  .filter((clue) => clue.found)
                  .map((clue) => (
                    <span key={clue.id} className="rounded-md border border-fuchsia-400/20 bg-white/5 px-2 py-1 text-xs font-black text-white">
                      {clue.description}
                    </span>
                  ))}
              </div>
            </section>

            <section className="space-y-3">
              <Label className="text-lg font-black text-white">犯人是谁？</Label>
              <p className="text-xs font-semibold leading-5 text-violet-100/70">
                只能从页面上的嫌疑人档案中选择，不是根据视频里有没有露脸来猜。
              </p>
              <RadioGroup value={culprit} onValueChange={setCulprit} className="gap-3">
                {caseFile.suspects.map((suspect) => (
                  <Label
                    key={suspect.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-fuchsia-400/20 bg-black/35 p-4 shadow-[0_0_18px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-black/45"
                  >
                    <RadioGroupItem value={suspect.id} className="mt-1" />
                    <span>
                      <span className="block text-base font-black text-white">{suspect.name}</span>
                      <span className="block text-sm leading-6 text-violet-100/72">{suspect.description}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <section className="space-y-3">
              <Label className="text-lg font-black text-white">作案工具有哪些？</Label>
              <p className="text-xs font-semibold leading-5 text-violet-100/70">
                只勾选与证据链能对应上的工具。无关工具会扣分。
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {answerToolOptions.map((option) => (
                  <Label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-fuchsia-400/20 bg-black/35 p-4 text-base font-black transition-transform hover:-translate-y-0.5 hover:bg-black/45"
                  >
                    <Checkbox checked={tools.includes(option.id)} onCheckedChange={() => toggleTool(option.id)} />
                    <span>{option.label}</span>
                  </Label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <Label htmlFor="motive" className="text-lg font-black text-white">
                作案动机（可选）
              </Label>
              <Textarea
                id="motive"
                value={motive}
                onChange={(event) => setMotive(event.target.value)}
                placeholder="写下你认为的动机、时间线或证据链"
                className="min-h-28"
              />
            </section>
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-fuchsia-400/20 bg-black/65 p-5 backdrop-blur-xl">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              继续调查
            </Button>
            <Button type="submit">提交推理</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
