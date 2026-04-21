export type SseExtractionStatusEvent = {
  type: "status";
  step: string;
  message: string;
};

export type SseExtractionResultEvent = {
  type: "result";
  data: Record<string, unknown>;
};

export type SseExtractionErrorEvent = {
  type: "error";
  message: string;
  status: number;
};

export type SseExtractionEvent =
  | SseExtractionStatusEvent
  | SseExtractionResultEvent
  | SseExtractionErrorEvent;

export async function* readExtractionSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SseExtractionEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.trim()) continue;

        const lines = part.trim().split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6);
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr) as Record<string, unknown>;

          if (eventType === "status") {
            yield {
              type: "status",
              step: String(parsed.step ?? ""),
              message: String(parsed.message ?? "")
            };
          } else if (eventType === "result") {
            yield { type: "result", data: parsed };
          } else if (eventType === "error") {
            yield {
              type: "error",
              message: String(parsed.message ?? "Erro desconhecido"),
              status: Number(parsed.status ?? 502)
            };
          }
        } catch {
          // skip malformed events
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
