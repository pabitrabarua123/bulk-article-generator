"use client";

import { Metadata } from "next";

import { CalendarDateRangePicker } from "./components/date-range-picker";
import { Overview } from "./components/overview";
import { RecentSales } from "./components/recent-sales";
import { Search } from "./components/search";
import TeamSwitcher from "./components/team-switcher";
import { UserNav } from "./components/user-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, Flex, Skeleton } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DashboardData } from "@/app/api/dashboard/route";
import { TrendChart } from "./components/trend-chart";
import { GodmodeArticles } from "@prisma/client";
import { useRouter } from "next/navigation";
import { TbCrown, TbBolt, TbFileText } from "react-icons/tb";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Example dashboard app built using the components.",
};

/*
  For more layout examples, check out:
  https://ui.shadcn.com/examples/dashboard

  For more charts examples, check out:
  https://ui.shadcn.com/charts
*/

export const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => {
      return axios.get<{ data: DashboardData }>("/api/dashboard");
    },
    queryKey: ["dashboard"]
  });

  const router = useRouter();
  const chartData = data?.data.data.charts || [];
  const revenue = data?.data.data.revenue;
  const subscriptions = data?.data.data.subscriptions;
  const orders = data?.data.data.orders;
  const activeNow = data?.data.data.activeNow;

  const {
    data: articleData,
    isLoading: articleLoading,
    error,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch(`/api/article-generator`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json() as Promise<{
        todos: (Omit<GodmodeArticles, "updatedAt"> & { updatedAt: string })[];
      }>;
    }
  });

  return (
    <>
      <Flex justifyContent="flex-start" w="100%" minH="100vh">
        <div className="flex-col w-full">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <TeamSwitcher />

              <div className="ml-auto flex items-center space-x-4">
                <Search />
                <UserNav />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex sm:items-center justify-between space-y-2 flex-col sm:flex-row">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <div className="flex items-center space-x-2">
                <CalendarDateRangePicker />
                <Button colorScheme="brand">Download</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
              <Card className="cursor-pointer" onClick={() => router.push("/article-generator")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-xl">
                    Generate God Mode articles
                  </CardTitle>
                  <TbCrown className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  These are articles of extremely high quality written after in depth research. 
                </CardContent>
              </Card>

              <Card className="cursor-pointer" onClick={() => router.push("/article-generator")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-xl">Generate Lite Mode Articles</CardTitle>
                  <TbBolt className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  These are free to generate articles good for guest posting and other purposes. 
                </CardContent>
              </Card>

              <Card className="cursor-pointer" onClick={() => router.push("/batch")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-xl">
                    Generated Articles
                  </CardTitle>
                  <TbFileText className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  Find your previously generated articles here.
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    God Mode Articles
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                   >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="7" y1="9" x2="17" y2="9" />
                    <line x1="7" y1="13" x2="17" y2="13" />
                    <line x1="7" y1="17" x2="12" y2="17" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <Skeleton isLoaded={!isLoading}>
                    <div className="text-2xl font-bold">
                      {revenue?.value || 0}
                    </div>
                  </Skeleton>
                  {/* <Skeleton isLoaded={!isLoading} mt="2px">
                    <p className="text-xs text-muted-foreground">
                      {revenue?.increase} from last month
                    </p>
                  </Skeleton> */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Lite Mode Articles
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                   >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="7" y1="9" x2="17" y2="9" />
                    <line x1="7" y1="13" x2="17" y2="13" />
                    <line x1="7" y1="17" x2="12" y2="17" />
                  </svg>
                </CardHeader>
                <CardContent>
                  
                  <Skeleton isLoaded={!isLoading}>
                    <div className="text-2xl font-bold">
                      {subscriptions?.value || 0}
                    </div>
                  </Skeleton>
                  {/* <Skeleton isLoaded={!isLoading} mt="2px">
                    <p className="text-xs text-muted-foreground">
                      {subscriptions?.increase} from last month
                    </p>
                  </Skeleton> */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Member Age</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <Skeleton isLoaded={!isLoading}>
                    <div className="text-2xl font-bold">
                      {orders?.value || 0}
                    </div>
                  </Skeleton>
                  {/* <Skeleton isLoaded={!isLoading} mt="2px">
                    <p className="text-xs text-muted-foreground">
                      {orders?.increase} from last month
                    </p>
                  </Skeleton> */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Batches
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                   <rect x="2" y="2" width="18" height="18" rx="2" />
                   <rect x="6" y="6" width="18" height="18" rx="2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <Skeleton isLoaded={!isLoading}>
                    <div className="text-2xl font-bold">
                      {activeNow?.value || 0}
                    </div>
                  </Skeleton>
                  {/* <Skeleton isLoaded={!isLoading} mt="2px">
                    <p className="text-xs text-muted-foreground">
                      {activeNow?.increase} since last hour
                    </p>
                  </Skeleton> */}
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Generations</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Skeleton isLoaded={!isLoading} borderRadius="8px">
                    <Overview data={chartData} />
                  </Skeleton>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Articles</CardTitle>
                  <CardDescription>
                    {articleData && `You made total ${articleData.todos.length} keywords.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton isLoaded={!isLoading} borderRadius="8px">
                  <div className="space-y-8">
                  {articleData && articleData.todos.slice(0, 7).map((article: { id: string; keyword: string; content: string | null }, index: number) => (
                   <div className="flex items-center" key={index}>
                    <div className="ml-4 space-y-1">
                     <p className="text-sm font-medium leading-none">
                      <a href={`/articles/${article.id}`}>{article.keyword}</a>
                     </p>
                    </div>
                   </div>
                  ))}
                  </div>
                  </Skeleton>
                </CardContent>
              </Card>
            </div>

            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle>Sales</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Skeleton isLoaded={!isLoading} borderRadius="8px">
                    <TrendChart data={trendData} />
                  </Skeleton>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
      </Flex>
    </>
  );
};
