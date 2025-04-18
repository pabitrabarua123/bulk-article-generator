import { prismaClient } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user.id as string;
    const groupedArticles = await prismaClient.godmodeArticles.groupBy({
        by: ['batch'],
        where: {
          userId: session?.user?.id,
        },
        _count: {
           batch: true,
        },
        _max: {
           createdAt: true,
        },
        orderBy: {
           _max: {
            createdAt: 'desc',
           },
        },
      });
      
      console.log(groupedArticles);

    let todos = groupedArticles;

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// creating unique batch
export async function POST(request: Request) {
  
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { batch } = await request.json();
  if (!batch) {
    return NextResponse.json({ error: "Batch is not there" }, { status: 401 });
  }

  try{
    let finalBatchName = batch.trim();
    let suffix = 1;

    // Check if the batch name exists
    let exists = await prismaClient.godmodeArticles.findFirst({
        where: { batch: finalBatchName }
    });

    // If exists, keep incrementing a suffix until it's unique
    while (exists) {
        finalBatchName = `${batch}${suffix}`;
        suffix++;

        exists = await prismaClient.godmodeArticles.findFirst({
            where: { batch: finalBatchName }
        });
    }

    return NextResponse.json({ status: 200, assignedBatch: finalBatchName });
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid a id" }, { status: 400 });
    }

    await prismaClient.godmodeArticles.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
