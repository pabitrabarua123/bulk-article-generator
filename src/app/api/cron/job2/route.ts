import { prismaClient } from "@/prisma/db";

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
                // update field cronRequest to 2
                
            }
        }  
      }
    }

    return new Response("Cron executed successfully!", { status: 200 });
  }