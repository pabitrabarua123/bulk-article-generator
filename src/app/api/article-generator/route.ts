import { prismaClient } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { OpenAI } from "openai";

// Function to get all articles for a user
async function getAllArticles(userId: string) {
  return await prismaClient.godmodeArticles.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Function to get articles by batch for a user
async function getArticlesByBatch(userId: string, batch: string) {
  return await prismaClient.godmodeArticles.findMany({
    where: { userId, batch },
    orderBy: { createdAt: "desc" },
  });
}

// Function to get a single article by ID for a user
async function getArticleById(userId: string, id: string) {
  return await prismaClient.godmodeArticles.findUnique({
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

    const userId = session?.user.id as string;
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
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session?.user.id as string;
  
  try {
    const {batch, text, prompt, is_godmode} = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid keyword" }, { status: 400 });
    }
    let aiResponse = '';
    if(is_godmode){
        // Split the text into individual keywords
        const keywords = text.split('\n').filter(keyword => keyword.trim() !== '');
        const articles = [];

        for (const keyword of keywords) {
            let article = await prismaClient.godmodeArticles.create({
                data: {
                    userId,
                    batch: batch,
                    keyword: keyword,
                    articleType: 'godmode'
                },
            });
            articles.push(article);

            const params = new URLSearchParams();
            params.append('keyword', keyword);
            params.append('id', article.id);
            params.append('comment', '.');
            params.append('featured_image_required', 'No');
            params.append('additional_image_required', 'No');
            params.append('expand_article', 'No');
            params.append('links', '.');
           // params.append('secret_key', 'kdfmnids9fds0fi4nrjr(*^nII');
            params.append('secret_key', 'kdfmnids9fds0fi4nrj');

            await fetch('https://hook.eu2.make.com/u0yss4lheap5qezqxgo3bcmhnhif517x', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
        }

        return NextResponse.json({ status: 200, articles });
    } else {
        let content = prompt.replace('{KEYWORD}', text);
        // Send keyword to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: content }],
            temperature: 0.7,
        });
        aiResponse = response.choices[0]?.message?.content || "No response from OpenAI";
        await prismaClient.godmodeArticles.create({
            data: {
                userId,
                content: aiResponse,
                batch: batch,
                keyword: text,
                articleType: 'lightmode',
                status: 1,
            },
        });
    
        return NextResponse.json({ status: 200, aiResponse });
    }

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
    const session = await getServerSession(authOptions);
    const userId = session?.user.id as string;

    const request_data = await request.json();
    
    if(request_data.type === 'update_balance'){
      const balanceField = request_data.balance_type;
      console.log(balanceField);

      const updated = await prismaClient.user.update({
        where: { id: userId },
        data: {
          [balanceField]: (request_data.balance - request_data.no_of_keyword),
        },
      });
      if(updated){
        return NextResponse.json({ status: 'success' });
      }else{
        return NextResponse.json({ status: 'failure' });
      }
    }

    if(request_data.type === 'article_upadte'){
      console.log(request_data.aiScore);
      if (!request_data.id || typeof request_data.id !== "string") {
        return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
      }
  
      if (request_data.content !== undefined && typeof request_data.content !== "string") {
        return NextResponse.json({ error: "Invalid article text" }, { status: 400 });
      }
  
      const updatedTodo = await prismaClient.godmodeArticles.update({
        where: { id: request_data.id },
        data: {
          content: request_data.content,
          aiScore: request_data.aiScore
        },
      });
  
      return NextResponse.json({ todo: updatedTodo });
    }

  } catch (error) {
    console.error("Error updating", error);
    return NextResponse.json(
      { error: "Failed to update" },
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
