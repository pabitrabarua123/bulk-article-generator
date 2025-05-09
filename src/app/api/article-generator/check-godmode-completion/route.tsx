import { prismaClient } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { sendTransactionalEmail } from "@/libs/loops";

export async function POST(request: Request) {
  
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { keywords } = await request.json();
    
    if (!keywords) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    let contentFilled = 0;
    let contentFilledKeywords = [];
    //let batch = '';

    for(let i = 0; i < keywords.length; i++){
      let article = await prismaClient.godmodeArticles.findUnique({
        where: { id: keywords[i] }
      });
      if(article){
          //batch = article.batchId;
          if(article.content){
             await prismaClient.godmodeArticles.update({
               where: { id: article.id },
               data: {
                 status: 1,
               },
             });
             contentFilled++;
             contentFilledKeywords.push(article.keyword);
          }
      }
    } 

    if(contentFilled === keywords.length){
      return NextResponse.json({ status: 200, res: 'Full', contentFilledKeywords });
    }
    if(contentFilled !== keywords.length && contentFilled > 0){
      return NextResponse.json({ status: 200, res: 'Partial', contentFilledKeywords, remainingKeywords: keywords.length - contentFilled });
    }
    if(contentFilled === 0){
      return NextResponse.json({ status: 200, res: 'Incomplete', remainingKeywords: keywords.length });
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}