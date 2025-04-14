import { authOptions } from "@/config/auth";
import { HttpStatusCode } from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// AI Detection API Endpoint
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HttpStatusCode.Unauthorized }
    );
  }

  try {
    const body = await req.json();
    const { content } = body;

    const response = await fetch("https://api.zerogpt.com/api/detect/detectText", {
      method: "POST",
      headers: {
        ApiKey: "2428fcf0-5363-40c5-889a-ccb116b98229",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_text: content,
      }),
    });

    const result = await response.json();

    return NextResponse.json(
      {
        aiScore: result?.data?.fakePercentage || "Unavailable",
      },
      { status: HttpStatusCode.Ok }
    );
  } catch (error) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatusCode.InternalServerError }
    );
  }
}
