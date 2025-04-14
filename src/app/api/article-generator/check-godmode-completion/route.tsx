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
    let batch = '';

    for(let i = 0; i < keywords.length; i++){
      let article = await prismaClient.godmodeArticles.findUnique({
        where: { id: keywords[i] }
      });
      if(article){
          batch = article.batch;
          if(article.content){
              contentFilled++;
              contentFilledKeywords.push(article.keyword);
          }
      }
    }

    const sendMail = async (subject: string, text1: string, text2: string) => {
      await sendTransactionalEmail({
        transactionalId: "cm9cv4eyr03qz110bow6g8cer",
        email: session.user?.email,
        dataVariables: {
          subject: subject,
          text1: String(contentFilledKeywords.length),
          text2: String(keywords.length - contentFilled),
        },
      });
    }

    let subject = '';
    let text1 = '';
    let text2 = '';

    if(contentFilled === keywords.length){
      text1 = `Articles generated in ${batch} are now completed`;
      text2 = '';
      subject = '';
      sendMail(subject, text1, text2);
      return NextResponse.json({ status: 200, res: 'Full', contentFilledKeywords });
    }
    if(contentFilled !== keywords.length && contentFilled > 0){
      text1 = '';
      text2 = '';
      subject = `Articles generated in ${batch} are partially completed`;
      sendMail(subject, text1, text2);
      return NextResponse.json({ status: 200, res: 'Partial', contentFilledKeywords, remainingKeywords: keywords.length - contentFilled });
    }
    if(contentFilled === 0){
      text1 = '';
      text2 = '';
      subject = `Article Generation for ${batch} is taking longer than expected`;
      sendMail(subject, text1, text2);
      return NextResponse.json({ status: 200, res: 'Partial', contentFilledKeywords, remainingKeywords: keywords.length - contentFilled });
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}