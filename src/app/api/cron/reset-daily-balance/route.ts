import { prismaClient } from "@/prisma/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get all users
    const users = await prismaClient.user.findMany();
    
    // Reset dailyBalance to 30 for all users
    const updatePromises = users.map(user => 
      prismaClient.user.update({
        where: { id: user.id },
        data: { dailyBalance: 30 }
      })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ 
      success: true, 
      message: "Daily balance reset completed successfully" 
    });
  } catch (error) {
    console.error("Error resetting daily balance:", error);
    return NextResponse.json(
      { error: "Failed to reset daily balance" },
      { status: 500 }
    );
  }
} 