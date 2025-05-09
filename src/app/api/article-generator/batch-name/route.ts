import { prismaClient } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }
    const batch = await prismaClient.batch.findUnique({
      where: { id: batchId, userId: session.user.id },
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    return NextResponse.json({ name: batch.name });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batch name" }, { status: 500 });
  }
} 