import { z } from "zod";
import { type MessagesOutput } from "~/server/api/routers/messages";

export const emailSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

export function parseGmailMessage(message: MessagesOutput["getEvents"][0]) {
  const headers = message.payload?.headers;
  if (!headers) {
    return null;
  }
  const subject =
    headers.find((header) => header.name === "Subject")?.value ?? "";
  const from = headers.find((header) => header.name === "From")?.value ?? "";
  const date = headers.find((header) => header.name === "Date")?.value ?? "";
  const to = headers.find((header) => header.name === "To")?.value ?? "";
  const text = extractPayloadParts(message);
  return {
    subject,
    from,
    date,
    to,
    payload: text,
  };
}

export function extractPayloadParts(message: MessagesOutput["getEvents"][0]) {
  if (!message.payload) {
    return null;
  }
  const part = message.payload;
  if (part.mimeType === "multipart/alternative") {
    // The message is a multipart message, likely including a text and HTML version
    // We'll just use the text version for now to keep things simple
    const b64Str = part.parts![0]!.body!.data!;
    return Buffer.from(b64Str, "base64").toString("utf-8");
  } else if (part.mimeType === "text/plain") {
    const b64Str = part.body!.data!;
    return Buffer.from(b64Str, "base64").toString("utf-8");
  } else if (part.mimeType?.startsWith("multipart/")) {
    const newPart = part.parts?.find(
      (p) => p.mimeType === "multipart/alternative",
    );
    if (newPart) {
      const b64Str = newPart.parts![0]!.body!.data!;
      return Buffer.from(b64Str, "base64").toString("utf-8");
    } else {
      return null;
    }
  } else {
    return null;
  }
}
