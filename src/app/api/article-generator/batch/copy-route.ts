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
        by: ['batchId'],
        where: {
          userId: session?.user?.id,
        },
        _count: {
           batchId: true,
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
      
    // Fetch all batch names for the batchIds
    const batchIds = groupedArticles.map((group) => group.batchId);
    const batches = await prismaClient.batch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, name: true },
    });
    const batchIdToName = Object.fromEntries(batches.map(b => [b.id, b.name]));

    // Attach batch name to each group
    const todos = groupedArticles.map(group => ({
      ...group,
      id: group.batchId,
      updatedAt: group._max?.createdAt,
      batch: batchIdToName[group.batchId] || group.batchId, // fallback to id if name missing
    }));

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
  const { batch, articleType, articles } = await request.json();
  const userId = session?.user.id as string;
  if (!batch) {
    return NextResponse.json({ error: "Batch is not there" }, { status: 401 });
  }

  try{
    let finalBatchName = batch.trim();
    let suffix = 1;

    // Check if the batch name exists
    let exists = await prismaClient.batch.findFirst({
        where: { name: finalBatchName }
    });

    // If exists, keep incrementing a suffix until it's unique
    while (exists) {
        finalBatchName = `${batch}${suffix}`;
        suffix++;

        exists = await prismaClient.batch.findFirst({
            where: { name: finalBatchName }
        });
    }

    let batch_created = await prismaClient.batch.create({
      data: {
        userId,
        name: finalBatchName,
        articleType: articleType,
        articles: articles,
        completed_articles: 0,
        pending_articles: articles,
        failed_articles: 0,
        status: 0,
      },
   });

    return NextResponse.json({ status: 200, assignedBatch: batch_created.id });
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