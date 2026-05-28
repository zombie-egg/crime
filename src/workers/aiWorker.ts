export type WorkerRequest = {
  id: string;
  tool: "yolo" | "mediapipe" | "classification";
  payload: unknown;
};

export type WorkerResponse = {
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: string;
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, tool, payload } = event.data;
  try {
    const response: WorkerResponse = {
      id,
      ok: true,
      payload: {
        tool,
        receivedAt: Date.now(),
        cached: false,
        payload,
      },
    };
    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : "AI worker failed",
    } satisfies WorkerResponse);
  }
};
