import { authOptions } from "@/config/auth";
import { prismaClient } from "@/prisma/db";
import { HttpStatusCode } from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from 'date-fns';

export type DashboardData = {
  revenue: {
    value: number;
    increase: string;
  };
  subscriptions: {
    value: number;
    increase: string;
  };
  orders: {
    value: number;
    increase: string;
  };
  activeNow: {
    value: number;
    increase: string;
  };
  charts: {
    name: string;
    total: number;
  }[];
  trend: {
    date: string;
    total: number;
  }[];
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HttpStatusCode.Unauthorized }
    );
  }

  try {
    const userId = session.user.id;
    const currentYear = new Date().getFullYear();

    // Execute all queries in parallel
    const [
      godmodeCount,
      litemodeCount,
      uniqueBatches,
      monthlyData
    ] = await Promise.all([
      // Count God Mode articles
      prismaClient.godmodeArticles.count({
        where: { userId, articleType: 'godmode' }
      }),
      
      // Count Lite Mode articles
      prismaClient.godmodeArticles.count({
        where: { userId, articleType: 'lightmode' }
      }),

      // Get unique batches
      prismaClient.godmodeArticles.groupBy({
        by: ['batch'],
        where: { userId }
      }),

      // Get monthly data in a single query
      prismaClient.godmodeArticles.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lte: new Date(currentYear, 11, 31)
          }
        },
        _count: true
      })
    ]);

    // Process monthly data
    const charts = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      const monthData = monthlyData.filter(data => {
        const date = new Date(data.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        name: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
        total: monthData.reduce((sum, data) => sum + (data._count || 0), 0)
      };
    });

    const data: DashboardData = {
      revenue: {
        value: godmodeCount,
        increase: "+20.1%",
      },
      subscriptions: {
        value: litemodeCount,
        increase: "+180%",
      },
      orders: {
        value: 34,
        increase: "+19%",
      },
      activeNow: {
        value: uniqueBatches.length,
        increase: "+201",
      },
      charts,
      trend: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(currentYear, i, 1).toISOString().split('T')[0],
        total: Math.floor(Math.random() * 5000) + 1000,
      })),
    };

    return NextResponse.json({ data }, { status: HttpStatusCode.Ok });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatusCode.InternalServerError }
    );
  }
}
