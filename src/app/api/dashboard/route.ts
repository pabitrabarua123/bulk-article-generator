import { authOptions } from "@/config/auth";
import { prismaClient } from "@/prisma/db";
import { HttpStatusCode } from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
    const godmodeCount = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id, articleType: 'godmode' }
    });
    
    const litemodeCount = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id, articleType: 'litemode' }
    });

    const uniqueBatches = await prismaClient.godmodeArticles.groupBy({
      by: ['batch'],
      where: { userId: session?.user?.id }
    });

    const articles = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id }
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
      charts: [
        {
          name: "Jan",
          total: 0,
        },
        {
          name: "Feb",
          total: 0,
        },
        {
          name: "Mar",
          total: articles,
        },
        {
          name: "Apr",
          total: 0,
        },
        {
          name: "May",
          total: 0,
        },
        {
          name: "Jun",
          total: 0,
        },
        {
          name: "Jul",
          total: 0,
        },
        {
          name: "Aug",
          total: 0,
        },
        {
          name: "Sep",
          total: 0,
        },
        {
          name: "Oct",
          total: 0,
        },
        {
          name: "Nov",
          total: 0,
        },
        {
          name: "Dec",
          total: 0,
        },
      ],
      trend: [
        {
          date: "2024-01-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-02-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-03-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-04-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-05-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-06-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-07-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-08-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-09-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-10-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-11-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
        {
          date: "2024-12-01",
          total: Math.floor(Math.random() * 5000) + 1000,
        },
      ],
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
