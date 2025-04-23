import { prismaClient } from "@/prisma/db";
import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from "@/libs/loops";

export async function GET() {

  console.log("🕑 Vercel cron job ran every 5 minutes!");
  
    let articles = await prismaClient.godmodeArticles.findMany({
        where: { articleType: 'godmode', cronRequest: 1 }
    });

    if(articles){
      for(let i = 0; i < articles.length; i++){
        if(articles[i].content){
            let batch = articles[i].batch;
            const [withContentCount, missingContentCount] = await Promise.all([
                prismaClient.godmodeArticles.count({
                    where: {
                        batch: batch,
                        NOT: [
                            { content: null }
                        ]
                    }
                }),
                prismaClient.godmodeArticles.count({
                    where: {
                        batch: batch,
                        OR: [
                            { content: null }
                        ]
                    }
                })
            ]);

            if(missingContentCount === 0){
                // send email to user to notify all articles populated
                let user = await prismaClient.user.findUnique({
                    where: {
                      id: articles[i].userId
                    }
                  });
                  
                  if (user?.email) {
                    await sendTransactionalEmail({
                      transactionalId: "cm9cv4eyr03qz110bow6g8cer",
                      email: user.email,
                      dataVariables: {
                        text1: `${withContentCount} Articles generated on Godmode are now ready`,
                        subject: `Articles generated in ${batch} are now completed`,
                        batch: batch
                      },
                    });
                  } else {
                    console.warn(`No email found for user ID: ${articles[i].userId}`);
                  }
                
            }
        }  
      }
    }

    return NextResponse.json({ ok: true });
  }