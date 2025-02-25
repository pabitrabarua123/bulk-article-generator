import { prismaClient } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { OpenAI } from "openai";

// Function to get all articles for a user
async function getAllArticles(userId: number) {
  return await prismaClient.articles.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Function to get articles by batch for a user
async function getArticlesByBatch(userId: number, batch: string) {
  return await prismaClient.articles.findMany({
    where: { userId, batch },
    orderBy: { createdAt: "desc" },
  });
}

// Function to get a single article by ID for a user
async function getArticleById(userId: string, id: string) {
  return await prismaClient.articles.findUnique({
    where: { id },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id; // Extract userId from session
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const batch = searchParams.get("batch");

    let todos;

    if (id) {
      // Fetch a single article by ID for the logged-in user
      const article = await getArticleById(userId, id);
      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
      return NextResponse.json({ todos: [article] }); // Wrap in an array for consistency
    } else if (batch) {
      // Fetch articles filtered by batch for the logged-in user
      todos = await getArticlesByBatch(userId, batch);
    } else {
      // Fetch all articles for the logged-in user
      todos = await getAllArticles(userId);
    }

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in .env
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  try {
    const {batch, text, prompt} = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid keyword" }, { status: 400 });
    }
    let content = prompt.replace('KEYWORD', text);
    // Send keyword to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Use GPT-4 or another model
      messages: [{ role: "user", content: content }],
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content || "No response from OpenAI";

    const newArticle = await prismaClient.articles.create({
      data: {
        userId: session?.user.id,
        content: aiResponse,
        batch: batch,
        keyword: text
      },
    });

    return NextResponse.json({ status: 200, aiResponse });

  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    if (content !== undefined && typeof content !== "string") {
      return NextResponse.json({ error: "Invalid todo text" }, { status: 400 });
    }

    const updatedContent = await prismaClient.articles.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json({ todo: updatedContent });
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
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

    await prismaClient.articles.delete({
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
