import { NextResponse } from "next/server";

import { getAllRepositories } from "@/server/repositories/repository.repo";

export async function GET(): Promise<NextResponse> {
  try {
    const repositories = getAllRepositories();

    return NextResponse.json({
      repositories: repositories.map((repository) => ({
        id: repository.id,
        name: repository.name,
        status: repository.status,
        fileCount: repository.fileCount,
        chunkCount: repository.chunkCount,
        createdAt: repository.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 },
    );
  }
}

export function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
