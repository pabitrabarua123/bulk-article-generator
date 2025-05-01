import { prismaClient } from "@/prisma/db";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {

  console.log("🕑 Vercel cron job ran every 5 minutes!");
  
    let articles = await prismaClient.godmodeArticles.findMany({
        where: { articleType: 'godmode', content: null, cronRequest: 0 }
    });

    if(articles){
      for(let i = 0; i < articles.length; i++){
          const now = new Date();
          const lastAllowedTime = new Date(articles[i].cronRequestAt.getTime() + 25 * 60 * 1000);
          if(articles[i].cronRequest === 0 && now > lastAllowedTime){
            // send request to make.com
            const params = new URLSearchParams();
            params.append('keyword', articles[i].keyword);
            params.append('id', articles[i].id);
            params.append('comment', '.');
            params.append('featured_image_required', 'No');
            params.append('additional_image_required', 'No');
            params.append('expand_article', 'No');
            params.append('links', '.');
            params.append('secret_key', 'kdfmnids9fds0fi4nrjr(*^nII');
           // params.append('secret_key', 'kdfmnids9fds0fi4I');

            const response = await fetch('https://hook.eu2.make.com/u0yss4lheap5qezqxgo3bcmhnhif517x', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString()
            });
            let aiResponse = await response.text();
            if(aiResponse === 'Accepted'){
              await prismaClient.godmodeArticles.update({
                where: { id: articles[i].id },
                data: {
                  cronRequestAt: now,
                  cronRequest: { increment: 1 },
                },
              });
            }
          }
        
      }
    }

    return NextResponse.json({ ok: true });
  }