import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { HttpStatusCode } from "axios";
import { prismaClient } from "@/prisma/db";
import { authOptions } from "@/config/auth";
import { stripeClient } from "@/libs/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HttpStatusCode.Unauthorized }
    );
  }

  const user = await prismaClient.user.findFirst({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HttpStatusCode.Unauthorized }
    );
  }

const { priceId } = await request.json();
try{
  let session1:any = await stripeClient.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    customer_email: session.user.email,
    success_url: `https://bulk-article-generator.vercel.app/article-generator?payment=success&type=lifetime&plan=${name}`, 
    cancel_url: 'https://bulk-article-generator.vercel.app/article-generator?payment=failed',
  });
  return NextResponse.json({ url: session1.url });
}catch(error:any){
  return NextResponse.json({ error: error.message }, { status: 500 });
}

}
