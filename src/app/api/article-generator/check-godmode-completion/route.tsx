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

    const sendMail = async (subject: string, text1: string) => {
      await sendTransactionalEmail({
        transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
        email: session.user?.email,
        dataVariables: {
          text1: text1,
          subject: subject,
          batch: batch
        },
      });
    }   

    let subject = '';
    let text1 = '';

    if(contentFilled === keywords.length){
      text1 = `${keywords.length} Articles generated on Godmode are now ready`;
      subject = `Articles generated in ${batch} are now completed`;
      await sendMail(subject, text1);
      return NextResponse.json({ status: 200, res: 'Full', contentFilledKeywords });
    }
    if(contentFilled !== keywords.length && contentFilled > 0){
      text1 = `${String(contentFilled)} Articles generated on Godmode are now ready. ${String(keywords.length - contentFilled)} Articles are still in progress, we will email you when they are done.`;
      subject = `Articles generated in ${batch} are partially completed`;
      await sendMail(subject, text1);
      return NextResponse.json({ status: 200, res: 'Partial', contentFilledKeywords, remainingKeywords: keywords.length - contentFilled });
    }
    if(contentFilled === 0){
      text1 = `${String(keywords.length)} Articles Generated on God mode will be completed in another 20 minutes`;
      subject = `Article Generation for ${batch} is taking longer than expected`;
      await sendMail(subject, text1);
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