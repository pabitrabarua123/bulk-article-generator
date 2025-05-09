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

    // Get counts and monthly data in a single optimized query
    const result = await prismaClient.godmodeArticles.groupBy({
      by: ['articleType', 'batchId', 'createdAt'],
      where: { 
        userId,
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        }
      },
      _count: true
    });

    // Process the data efficiently
    const godmodeCount = result.filter(r => r.articleType === 'godmode')
      .reduce((sum, r) => sum + (r._count || 0), 0);
    const litemodeCount = result.filter(r => r.articleType === 'lightmode')
      .reduce((sum, r) => sum + (r._count || 0), 0);
    const uniqueBatches = Array.from(new Set(result.map(r => r.batchId)));

    // Process monthly data efficiently
    const monthlyCounts = new Array(12).fill(0);
    result.forEach(r => {
      const date = new Date(r.createdAt);
      if (date.getFullYear() === currentYear) {
        monthlyCounts[date.getMonth()] += r._count || 0;
      }
    });

    const charts = monthlyCounts.map((total, i) => ({
      name: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
      total
    }));

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
