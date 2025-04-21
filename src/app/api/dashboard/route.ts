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
    const godmodeCount = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id, articleType: 'godmode' }
    });
    
    const litemodeCount = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id, articleType: 'lightmode' }
    });

    const uniqueBatches = await prismaClient.godmodeArticles.groupBy({
      by: ['batch'],
      where: { userId: session?.user?.id }
    });

    const articles = await prismaClient.godmodeArticles.count({
      where: { userId: session?.user?.id }
    });

    const currentYear = new Date().getFullYear();

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
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 0)),
              lte: endOfMonth(new Date(currentYear, 0)),
             },
            },
          }),
        },
        {
          name: "Feb",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 1)),
              lte: endOfMonth(new Date(currentYear, 1)),
             },
            },
          }),
        },
        {
          name: "Mar",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 2)),
              lte: endOfMonth(new Date(currentYear, 2)),
             },
            },
          }),
        },
        {
          name: "Apr",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 3)),
              lte: endOfMonth(new Date(currentYear, 3)),
             },
            },
          }),
        },
        {
          name: "May",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 4)),
              lte: endOfMonth(new Date(currentYear, 4)),
             },
            },
          }),
        },
        {
          name: "Jun",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 5)),
              lte: endOfMonth(new Date(currentYear, 5)),
             },
            },
          }),
        },
        {
          name: "Jul",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 6)),
              lte: endOfMonth(new Date(currentYear, 6)),
             },
            },
          }),
        },
        {
          name: "Aug",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 7)),
              lte: endOfMonth(new Date(currentYear, 7)),
             },
            },
          }),
        },
        {
          name: "Sep",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 8)),
              lte: endOfMonth(new Date(currentYear, 8)),
             },
            },
          }),
        },
        {
          name: "Oct",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 9)),
              lte: endOfMonth(new Date(currentYear, 9)),
             },
            },
          }),
        },
        {
          name: "Nov",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 10)),
              lte: endOfMonth(new Date(currentYear, 10)),
             },
            },
          }),
        },
        {
          name: "Dec",
          total: await prismaClient.godmodeArticles.count({
            where: {
             createdAt: {
              gte: startOfMonth(new Date(currentYear, 11)),
              lte: endOfMonth(new Date(currentYear, 11)),
             },
            },
          }),
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
