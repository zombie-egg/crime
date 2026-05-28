import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const hits = new Map();

loadLocalEnv();

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      writeJson(res, 400, { error: "Missing URL" });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname === "/api/assistant") {
      await handleAssistant(req, res);
      return;
    }
    if (url.pathname === "/api/reconstruct") {
      await handleImage(req, res);
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    writeJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0", () => {
  console.log(`Neon Detective AI listening on ${port}`);
});

async function handleAssistant(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const clientId = req.socket.remoteAddress ?? "local";
  if (!withinRateLimit(clientId)) {
    writeJson(res, 429, { error: "Rate limit exceeded" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    writeJson(res, 200, { answer: "AI 中转 Key 未配置。当前使用离线助手：先读嫌疑人档案，再比对权限、动机和矛盾点。" });
    return;
  }

  const body = await readJson(req);
  const prompt = String(body.prompt ?? "").slice(0, 1200);
  const caseTitle = String(body.caseTitle ?? "unknown case").slice(0, 120);
  const caseBriefing = String(body.caseBriefing ?? "").slice(0, 600);
  const suspects = Array.isArray(body.suspects) ? body.suspects.map((item) => String(item).slice(0, 160)).slice(0, 6) : [];
  const foundClues = Array.isArray(body.foundClues)
    ? body.foundClues.map((item) => String(item).slice(0, 240)).slice(0, 12)
    : [];

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.pophcc.com").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const upstream = await fetch(`${baseUrl}/v1/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "xhigh" },
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

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    writeJson(res, 200, { answer: fallbackAssistantAnswer(caseTitle, foundClues, prompt) });
    return;
  }
  writeJson(res, 200, { answer: extractOutputText(data) || fallbackAssistantAnswer(caseTitle, foundClues, prompt) });
}

async function handleImage(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const clientId = req.socket.remoteAddress ?? "local";
  if (!withinRateLimit(`${clientId}:image`)) {
    writeJson(res, 429, { error: "Rate limit exceeded" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    writeJson(res, 503, { error: "OPENAI_API_KEY is not configured" });
    return;
  }

  const body = await readJson(req);
  const prompt = String(body.prompt ?? "").slice(0, 1800);
  const caseTitle = String(body.caseTitle ?? "案件视觉重建").slice(0, 120);
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.pophcc.com").replace(/\/$/, "");
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

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

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    writeJson(res, upstream.status, { error: data.error?.message || "OpenAI image request failed" });
    return;
  }

  const first = data.data?.[0];
  const imageUrl = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : undefined);
  writeJson(res, 200, {
    imageUrl,
    summary: imageUrl ? `${caseTitle} 的案发过程重建图已生成。` : "图片接口返回成功，但没有包含可显示的图片数据。",
  });
}

async function serveStatic(rawPathname, res) {
  const pathname = decodeURIComponent(rawPathname);
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(distDir, safePath));
  if (!filePath.startsWith(distDir)) {
    writeJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      res.statusCode = 200;
      res.setHeader("Content-Type", contentType(filePath));
      createReadStream(filePath).pipe(res);
      return;
    }
  } catch {
    // Fall through to SPA entry.
  }

  const indexPath = path.join(distDir, "index.html");
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  createReadStream(indexPath).pipe(res);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function withinRateLimit(clientId) {
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (hits.get(clientId) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= 12) return false;
  recent.push(now);
  hits.set(clientId, recent);
  return true;
}

function extractOutputText(data) {
  const direct =
    valueToText(data.output_text) ||
    valueToText(data.text) ||
    valueToText(data.content) ||
    valueToText(data.message?.content);
  if (direct) return direct;
  const choiceText = data.choices
    ?.map((choice) => valueToText(choice.text) || valueToText(choice.message?.content) || valueToText(choice.delta?.content))
    .filter(Boolean)
    .join("")
    .trim();
  if (choiceText) return choiceText;
  return (
    data.output
      ?.flatMap((item) => [valueToText(item.text), ...(item.content ?? []).map((content) => valueToText(content.text) || valueToText(content.content))])
      .filter(Boolean)
      .join("")
      .trim() || ""
  );
}

function valueToText(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => valueToText(item)).filter(Boolean).join("").trim();
  if (typeof value === "object") {
    return valueToText(value.text) || valueToText(value.content) || valueToText(value.output_text) || valueToText(value.message);
  }
  return "";
}

function fallbackAssistantAnswer(caseTitle, foundClues, prompt) {
  if (!foundClues.length) return `《${caseTitle}》还缺少证据。先读嫌疑人档案，再用 AI 工具补齐现场异常点。`;
  if (/谁|犯人|嫌疑|culprit/i.test(prompt)) {
    return `凶手不靠视频露脸判断。把 ${foundClues.length} 条线索和嫌疑人的权限、动机、矛盾点逐项比对。`;
  }
  return `已记录 ${foundClues.length} 条线索。重点看哪名嫌疑人的档案能同时解释权限、动机和工具。`;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".wav": "audio/wav",
    }[ext] || "application/octet-stream"
  );
}

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, filename);
    if (!existsSync(envPath)) continue;
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}
