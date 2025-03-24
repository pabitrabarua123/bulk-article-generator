import { authOptions } from "@/config/auth";
import { prismaClient } from "@/prisma/db";
import { HttpStatusCode } from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HttpStatusCode.Unauthorized }
    );
  }

  try {
    const SubscriptionPlan = await prismaClient.userPlan.findFirst({
      where: { userId: session?.user?.id, stripeSubscriptionId: { not: null } }
    });
    let SubscriptionDetails;
    if(SubscriptionPlan && SubscriptionPlan.planId !== null){
        SubscriptionDetails = await prismaClient.subscriptionPlan.findFirst({
          where: { id : SubscriptionPlan.planId }
        });
    }

    const LifetimePlan = await prismaClient.userPlan.findFirst({
        where: { userId: session?.user?.id, stripeSubscriptionId: null }
    });
    let LifetimeDetails;
    if(LifetimePlan && LifetimePlan.planId !== null){
        LifetimeDetails = await prismaClient.lifetimePlan.findFirst({
          where: { id : LifetimePlan.planId }
        });
    }


    return NextResponse.json({ SubscriptionPlan, SubscriptionDetails, LifetimePlan, LifetimeDetails }, { status: HttpStatusCode.Ok });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatusCode.InternalServerError }
    );
  }
}
