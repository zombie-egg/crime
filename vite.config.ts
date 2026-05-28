import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), localOpenAIProxy(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
}));

function localOpenAIProxy(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");
  const hits = new Map<string, number[]>();

  return {
    name: "local-openai-responses-proxy",
    configureServer(server) {
      server.middlewares.use("/api/assistant", createAssistantHandler(env, hits));
      server.middlewares.use("/api/reconstruct", createImageHandler(env, hits));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/assistant", createAssistantHandler(env, hits));
      server.middlewares.use("/api/reconstruct", createImageHandler(env, hits));
    },
  };
}

function createAssistantHandler(env: Record<string, string>, hits: Map<string, number[]>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      writeJson(res, { error: "Method not allowed" });
      return;
    }

    const clientId = req.socket.remoteAddress ?? "local";
    if (!withinRateLimit(hits, clientId)) {
      res.statusCode = 429;
      writeJson(res, { error: "Rate limit exceeded" });
      return;
    }

    try {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        res.statusCode = 503;
        writeJson(res, { error: "OPENAI_API_KEY is not configured" });
        return;
      }

      const body = await readJson(req);
      const prompt = String(body.prompt ?? "").slice(0, 1200);
      const caseTitle = String(body.caseTitle ?? "unknown case").slice(0, 120);
      const caseBriefing = String(body.caseBriefing ?? "").slice(0, 600);
      const suspects = Array.isArray(body.suspects)
        ? body.suspects.map((item) => String(item).slice(0, 160)).slice(0, 6)
        : [];
      const foundClues = Array.isArray(body.foundClues)
        ? body.foundClues.map((item) => String(item).slice(0, 240)).slice(0, 12)
        : [];

      const baseUrl = (env.OPENAI_BASE_URL || "https://api.pophcc.com").replace(/\/$/, "");
      const model = env.OPENAI_MODEL || "gpt-5.5";
      const upstream = await fetch(`${baseUrl}/v1/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          store: false,
          reasoning: { effort: env.OPENAI_REASONING_EFFORT || "xhigh" },
          input: [
            {
              role: "system",
              content:
                "你是互动侦探游戏里的 AI 导演助手。必须用简体中文回答，基于玩家已发现线索给出下一步推理建议；不要直接公布犯人，除非玩家已经明确提交答案。80字以内。",
            },
            {
              role: "user",
              content: [
                `案件：${caseTitle}`,
                caseBriefing ? `背景：${caseBriefing}` : "",
                suspects.length ? `嫌疑人：${suspects.join("；")}` : "",
                `已发现线索：${foundClues.join("；") || "暂无"}`,
                `玩家问题：${prompt}`,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        }),
      });

      const data = (await upstream.json().catch(() => ({}))) as ResponsesPayload;
      if (!upstream.ok) {
        res.statusCode = upstream.status;
        writeJson(res, { error: data.error?.message || "OpenAI proxy request failed" });
        return;
      }

      writeJson(res, { answer: extractOutputText(data) || fallbackAssistantAnswer(caseTitle, foundClues, prompt) });
    } catch (error) {
      res.statusCode = 500;
      writeJson(res, { error: error instanceof Error ? error.message : "Assistant proxy failed" });
    }
  };
}

function createImageHandler(env: Record<string, string>, hits: Map<string, number[]>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      writeJson(res, { error: "Method not allowed" });
      return;
    }

    const clientId = req.socket.remoteAddress ?? "local";
    if (!withinRateLimit(hits, `${clientId}:image`)) {
      res.statusCode = 429;
      writeJson(res, { error: "Rate limit exceeded" });
      return;
    }

    try {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        res.statusCode = 503;
        writeJson(res, { error: "OPENAI_API_KEY is not configured" });
        return;
      }

      const body = await readJson(req);
      const prompt = String(body.prompt ?? "").slice(0, 1800);
      const caseTitle = String(body.caseTitle ?? "案件视觉重建").slice(0, 120);
      const baseUrl = (env.OPENAI_BASE_URL || "https://api.pophcc.com").replace(/\/$/, "");
      const imageModel = env.OPENAI_IMAGE_MODEL || "gpt-image-1";

      const upstream = await fetch(`${baseUrl}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: imageModel,
          prompt,
          size: "1024x1024",
          quality: "low",
          n: 1,
        }),
      });

      const data = (await upstream.json().catch(() => ({}))) as ImagesPayload;
      if (!upstream.ok) {
        res.statusCode = upstream.status;
        writeJson(res, { error: data.error?.message || "OpenAI image request failed" });
        return;
      }

      const first = data.data?.[0];
      const imageUrl = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : undefined);
      writeJson(res, {
        imageUrl,
        summary: imageUrl
          ? `${caseTitle} 的案发过程重建图已生成。`
          : "图片接口返回成功，但没有包含可显示的图片数据。",
      });
    } catch (error) {
      res.statusCode = 500;
      writeJson(res, { error: error instanceof Error ? error.message : "Image proxy failed" });
    }
  };
}

type ResponsesPayload = {
  output_text?: unknown;
  text?: unknown;
  content?: unknown;
  message?: { content?: unknown };
  choices?: Array<{
    text?: unknown;
    message?: { content?: unknown };
    delta?: { content?: unknown };
  }>;
  error?: { message?: string };
  output?: Array<{
    text?: unknown;
    content?: Array<{
      text?: unknown;
      content?: unknown;
      type?: string;
    }>;
  }>;
};

type ImagesPayload = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: { message?: string };
};

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function writeJson(res: ServerResponse, payload: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function withinRateLimit(hits: Map<string, number[]>, clientId: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (hits.get(clientId) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= 12) return false;
  recent.push(now);
  hits.set(clientId, recent);
  return true;
}

function extractOutputText(data: ResponsesPayload) {
  const outputText = valueToText(data.output_text);
  if (outputText) return outputText;
  const textValue = valueToText(data.text);
  if (textValue) return textValue;
  const directContent = valueToText(data.content);
  if (directContent) return directContent;
  const messageContent = valueToText(data.message?.content);
  if (messageContent) return messageContent;
  const choiceText = data.choices
    ?.map((choice) => valueToText(choice.text) || valueToText(choice.message?.content) || valueToText(choice.delta?.content))
    .filter(Boolean)
    .join("")
    .trim();
  if (choiceText) return choiceText;
  const text = data.output
    ?.flatMap((item) => [valueToText(item.text), ...(item.content ?? []).map((content) => valueToText(content.text) || valueToText(content.content))])
    .filter(Boolean)
    .join("")
    .trim();
  return text || "";
}

function valueToText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => valueToText(item))
      .filter(Boolean)
      .join("")
      .trim();
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      valueToText(record.text) ||
      valueToText(record.content) ||
      valueToText(record.output_text) ||
      valueToText(record.message)
    );
  }
  return "";
}

function fallbackAssistantAnswer(caseTitle: string, foundClues: string[], prompt: string) {
  const clueCount = foundClues.length;
  const asksForCulprit = /谁|犯人|嫌疑|culprit/i.test(prompt);
  if (clueCount === 0) {
    return `《${caseTitle}》还缺少证据。先用物体检测和场景识别锁定环境，再用姿态分析验证人物动作。`;
  }
  if (asksForCulprit) {
    return `目前只能推断作案条件。把已发现线索和三名嫌疑人的权限、动机逐一对应，不要只看单个物件。`;
  }
  return `已记录 ${clueCount} 条线索。建议按“场景背景→可疑物体→人物动作→文档记录”的顺序补全证据链。`;
}
