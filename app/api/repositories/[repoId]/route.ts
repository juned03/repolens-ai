import { NextResponse } from "next/server";

import { getRepositoryById } from "@/server/repositories/repository.repo";
import { deleteRepositoryById } from "@/server/services/repository/repository.service";

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { repoId } = await params;
  const repository = getRepositoryById(repoId);

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  return NextResponse.json(repository);
}

export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { repoId } = await params;

  try {
    await deleteRepositoryById(repoId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete repository";

    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
