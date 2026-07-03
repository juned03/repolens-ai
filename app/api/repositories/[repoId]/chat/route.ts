import { NextResponse } from "next/server";
import { z } from "zod";

import { streamRepositoryAnswer } from "@/server/services/chat/rag.service";

const chatRequestSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(2000, "Question must be 2000 characters or fewer"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repoId: string }> },
): Promise<Response> {
  const { repoId } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = chatRequestSchema.safeParse(body);

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "Invalid request";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { stream } = await streamRepositoryAnswer(
      repoId,
      validation.data.question,
    );

    return stream.toTextStreamResponse();
  } catch (error) {
    console.error("Chat streaming failed:", error);

    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 },
    );
  }
}
