import { prismaClient } from "@/prisma/db";
import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from "@/libs/loops";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log("🕑 Vercel cron job ran!");
  const now = new Date();
  const twentyFiveMinutesAgo = new Date(now.getTime() - 25 * 60 * 1000);

  const candidateBatches = await prismaClient.batch.findMany({
    where: {
      articleType: 'godmode',
      status: 0,
      updatedAt: { lt: twentyFiveMinutesAgo }
    },
  });

  console.log(`Found ${candidateBatches.length} batches to process (>25 mins since last update)`);

  for (const batch of candidateBatches) {
    const timeSinceUpdate = Math.round((now.getTime() - batch.updatedAt.getTime()) / (1000 * 60));
    console.log(`Processing batch ${batch.id} (${batch.name}) - Last updated ${timeSinceUpdate} minutes ago`);

    const user = await prismaClient.user.findUnique({ where: { id: batch.userId } });
    if (!user || !user.email) {
      console.error(`User ID ${batch.userId} not found or has no email for batch ${batch.id}. Skipping batch.`);
      continue;
    }

    const pendingArticlesInDB = await prismaClient.pendingGodmodeArticles.findMany({
      where: { batchId: batch.id },
    });

    if (pendingArticlesInDB.length === 0) {
      console.log(`Batch ${batch.id}: No pending articles found. Marking as complete.`);
      await prismaClient.batch.update({
        where: { id: batch.id },
        data: {
          status: 1,
          pending_articles: 0,
          completed_articles: batch.articles,
          updatedAt: now,
        },
      });
      
      // Send email for no pending articles
      if (user.email) {
        try {
          await sendTransactionalEmail({
            transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
            email: user.email,
            dataVariables: {
              text1: `${batch.articles} Articles generated on Godmode are now ready`,
              subject: `Articles generated in ${batch.name} are now completed`,
              batch: batch.id
            },
          });
          console.log(`Successfully sent completion email to ${user.email} for batch ${batch.id}`);
        } catch (error) {
          console.error(`Failed to send completion email to ${user.email} for batch ${batch.id}:`, error);
        }
      }
      continue;
    }

    const articlesWithContentStatus = await Promise.all(
      pendingArticlesInDB.map(async (pa) => {
        const godmodeArticle = await prismaClient.godmodeArticles.findUnique({
          where: { id: pa.godmodeArticleId },
          select: { content: true, id: true },
        });
        return {
          pendingArticle: pa,
          godmodeArticleId: godmodeArticle?.id,
          hasContent: !!godmodeArticle?.content,
        };
      })
    );

    const readyArticles = articlesWithContentStatus.filter(a => a.hasContent);
    const notReadyArticles = articlesWithContentStatus.filter(a => !a.hasContent);
    const hasPreviouslyAttemptedAllPending = notReadyArticles.length > 0 && notReadyArticles.every(p => p.pendingArticle.cronRequest === 1);

    // If all pending articles have been attempted, force completion
    if (hasPreviouslyAttemptedAllPending) {
      console.log(`Batch ${batch.id}: All pending articles have been attempted. Forcing completion.`);
      await prismaClient.$transaction(async (tx) => {
        const newlyCompletedCount = readyArticles.length;
        const failedCount = notReadyArticles.length;

        await tx.batch.update({
          where: { id: batch.id },
          data: {
            status: 1,
            completed_articles: batch.completed_articles + newlyCompletedCount,
            pending_articles: 0,
            failed_articles: batch.failed_articles + failedCount,
            updatedAt: now,
          },
        });

        if (newlyCompletedCount > 0) {
          await tx.godmodeArticles.updateMany({
            where: { id: { in: readyArticles.map(a => a.godmodeArticleId).filter(id => id) as string[] } },
            data: { status: 1 },
          });
        }

        await tx.pendingGodmodeArticles.deleteMany({
          where: { batchId: batch.id },
        });

        const finalCompleted = batch.completed_articles + newlyCompletedCount;
        
        // Send email for forced completion
        if (user.email) {
          try {
            await sendTransactionalEmail({
              transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
              email: user.email,
              dataVariables: {
                text1: `${finalCompleted} Articles generated on Godmode are now ready. ${failedCount} Articles could not be generated in time.`,
                subject: `Articles generated in ${batch.name} are now completed`,
                batch: batch.id
              },
            });
            console.log(`Successfully sent forced completion email to ${user.email} for batch ${batch.id}`);
          } catch (error) {
            console.error(`Failed to send forced completion email to ${user.email} for batch ${batch.id}:`, error);
          }
        }
      });
      continue;
    }

    // SCENARIO 1: All pending articles are now ready
    if (notReadyArticles.length === 0 && pendingArticlesInDB.length > 0) {
      console.log(`Batch ${batch.id}: All ${pendingArticlesInDB.length} pending articles are ready.`);
      await prismaClient.$transaction(async (tx) => {
        await tx.batch.update({
          where: { id: batch.id },
          data: {
            status: 1,
            completed_articles: batch.articles,
            pending_articles: 0,
            updatedAt: now,
          },
        });
        await tx.godmodeArticles.updateMany({
          where: { id: { in: readyArticles.map(a => a.godmodeArticleId).filter(id => id) as string[] } },
          data: { status: 1 },
        });
        await tx.pendingGodmodeArticles.deleteMany({
          where: { batchId: batch.id },
        });
        
        // Send email for all articles ready
        if (user.email) {
          try {
            await sendTransactionalEmail({
              transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
              email: user.email,
              dataVariables: {
                text1: `${batch.articles} Articles generated on Godmode are now ready`,
                subject: `Articles generated in ${batch.name} are now completed`,
                batch: batch.id
              },
            });
            console.log(`Successfully sent all-ready email to ${user.email} for batch ${batch.id}`);
          } catch (error) {
            console.error(`Failed to send all-ready email to ${user.email} for batch ${batch.id}:`, error);
          }
        }
      });
      continue;
    }

    // SCENARIO 2: Partially ready
    if (readyArticles.length > 0 && notReadyArticles.length > 0) {
      console.log(`Batch ${batch.id}: ${readyArticles.length} ready, ${notReadyArticles.length} not ready.`);
      let newApiCallsMade = false;
      await prismaClient.$transaction(async (tx) => {
        await tx.batch.update({
          where: { id: batch.id },
          data: {
            completed_articles: batch.completed_articles + readyArticles.length,
            pending_articles: notReadyArticles.length,
          },
        });

        await tx.godmodeArticles.updateMany({
          where: { id: { in: readyArticles.map(a => a.godmodeArticleId).filter(id => id) as string[] } },
          data: { status: 1 },
        });

        await tx.pendingGodmodeArticles.deleteMany({
          where: { id: { in: readyArticles.map(a => a.pendingArticle.id) } },
        });

        const apiCalls = notReadyArticles.map(async (articleData) => {
          if (articleData.pendingArticle.cronRequest === 0) {
            await tx.pendingGodmodeArticles.update({
              where: { id: articleData.pendingArticle.id },
              data: { cronRequest: 1 },
            });
            newApiCallsMade = true;
            
            if (!articleData.godmodeArticleId) {
              console.error(`Batch ${batch.id}: Missing godmodeArticleId for pending article ${articleData.pendingArticle.id}. Skipping API call.`);
              return;
            }

            const params = new URLSearchParams();
            params.append('keyword', articleData.pendingArticle.keywordId);
            params.append('id', articleData.godmodeArticleId);
            params.append('comment', '.');
            params.append('featured_image_required', 'No');
            params.append('additional_image_required', 'No');
            params.append('expand_article', 'No');
            params.append('links', '.');
           // params.append('secret_key', 'kdfmnids9fds0fi4nrjr(*^nII');
            params.append('secret_key', 'kdfmnids9fds0fi4nrjr');

            await fetch('https://hook.eu2.make.com/u0yss4lheap5qezqxgo3bcmhnhif517x', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            console.log(`Batch ${batch.id}: Made API call for pending article ${articleData.pendingArticle.id} (keyword: ${articleData.pendingArticle.keywordId})`);
          }
        });

        await Promise.all(apiCalls);

        if (newApiCallsMade) {
          await tx.batch.update({ 
            where: { id: batch.id }, 
            data: { updatedAt: now } 
          });
        }

        const currentTotalCompleted = batch.completed_articles + readyArticles.length;
        
        if (user.email) {
          try {
            await sendTransactionalEmail({
              transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
              email: user.email,
              dataVariables: {
                text1: `${currentTotalCompleted} Articles generated on Godmode are now ready. ${notReadyArticles.length} Articles are still in progress, we will email you when they are done.`,
                subject: `Articles generated in ${batch.name} are partially completed`,
                batch: batch.id
              },
            });
            console.log(`Successfully sent partial completion email to ${user.email} for batch ${batch.id}`);
          } catch (error) {
            console.error(`Failed to send partial completion email to ${user.email} for batch ${batch.id}:`, error);
          }
        }
      });
      continue;
    }

    // SCENARIO 3: No *currently* pending articles are ready
    if (notReadyArticles.length > 0 && readyArticles.length === 0) {
      console.log(`Batch ${batch.id}: None of the ${notReadyArticles.length} pending articles are ready yet.`);
      let newApiCallsMade = false;
      const articlesToRequestApiFor = notReadyArticles.filter(a => a.pendingArticle.cronRequest === 0);

      if (articlesToRequestApiFor.length > 0) {
        await prismaClient.$transaction(async (tx) => {
          const apiCalls = articlesToRequestApiFor.map(async (articleData) => {
            await tx.pendingGodmodeArticles.update({
              where: { id: articleData.pendingArticle.id },
              data: { cronRequest: 1 },
            });
            newApiCallsMade = true;

            if (!articleData.godmodeArticleId) {
              console.error(`Batch ${batch.id}: Missing godmodeArticleId for pending article ${articleData.pendingArticle.id}. Skipping API call.`);
              return;
            }

            const params = new URLSearchParams();
            params.append('keyword', articleData.pendingArticle.keywordId);
            params.append('id', articleData.godmodeArticleId);
            params.append('comment', '.');
            params.append('featured_image_required', 'No');
            params.append('additional_image_required', 'No');
            params.append('expand_article', 'No');
            params.append('links', '.');
            params.append('secret_key', 'kdfmnids9fds0fi4nrjr');
           // params.append('secret_key', 'kdfmnids9fds0fi4nrjr(*^nII');

            await fetch('https://hook.eu2.make.com/u0yss4lheap5qezqxgo3bcmhnhif517x', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            console.log(`Batch ${batch.id}: Made API call for pending article ${articleData.pendingArticle.id} (keyword: ${articleData.pendingArticle.keywordId})`);
          });

          await Promise.all(apiCalls);

          if (newApiCallsMade) {
            await tx.batch.update({ 
              where: { id: batch.id }, 
              data: { updatedAt: now } 
            });
          }
          
          if (user.email) {
            try {
              await sendTransactionalEmail({
                transactionalId: "cm9ygo9eu6c9jybikh7bzz1hw",
                email: user.email,
                dataVariables: {
                  text1: `${notReadyArticles.length} Articles Generated on God mode will be completed in another 20 minutes`,
                  subject: `Article Generation for ${batch.name} is taking longer than expected`,
                  batch: batch.id
                },
              });
              console.log(`Successfully sent processing email to ${user.email} for batch ${batch.id}`);
            } catch (error) {
              console.error(`Failed to send processing email to ${user.email} for batch ${batch.id}:`, error);
            }
          }
        });
      } else {
        console.log(`Batch ${batch.id}: All pending articles already have API request sent. Waiting for content or 25-min timeout.`);
      }
      continue;
    }

    console.log(`Batch ${batch.id}: No specific scenario met. Pending: ${pendingArticlesInDB.length}, Ready: ${readyArticles.length}, NotReady: ${notReadyArticles.length}`);
  }

  return NextResponse.json({ ok: true });
}