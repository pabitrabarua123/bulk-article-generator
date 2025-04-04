"use client";

import { Metadata } from "next";


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
import { User } from "@prisma/client";
import { paymentProvider } from "@/config";
import toast from "react-hot-toast";

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

export const Account = () => {

    const {
        data: userData,
        isLoading,
        error,
      } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
          const response = await fetch('/api/user');
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json() as Promise<{
            user: User;
          }>;
        },
        enabled: true,
    });
    const user = userData?.user ?? null;
    console.log(user);

    const {
        data: planData,
        isLoading: planLoading,
        error: planError,
      } = useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
          const response = await fetch('/api/account');
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        },
        enabled: true,
    });
    
    console.log(planData);

    const getStripeCustomerPortalUrl = async () => {
        const response = await axios.get("/api/stripe/customer-portal");
        return response?.data?.url;
      };
      
     const onLoadCustomerPortal = async () => {
        try {
      
          if (paymentProvider === "stripe") {
            const url = await getStripeCustomerPortalUrl();
            if (url) {
              window.open(url, "_blank");
              return;
            }
          }
      
          toast.error("You don't have an active subscription");
        } catch (error) {
          toast.error("You don't have an active subscription");
        }
      };

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
            

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                  Daily Balance
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
                      { user && user?.dailyBalance && user.dailyBalance}/30
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
                   Lite Mode Balance
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
                    { user && user?.LiteModeBalance && user.LiteModeBalance }
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
                  <CardTitle className="text-sm font-medium">God Mode Balance</CardTitle>
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
                    { user && user?.monthyBalance > 0 ? <p>{user.monthyBalance} <span className="text-sm text-gray-500">Monthly</span></p> : user && user?.lifetimeBalance > 0 ? user.lifetimeBalance : 0}
                    </div>
                  </Skeleton>
                  {/* <Skeleton isLoaded={!isLoading} mt="2px">
                    <p className="text-xs text-muted-foreground">
                      {orders?.increase} from last month
                    </p>
                  </Skeleton> */}
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Current Plan(s)</CardTitle>  
                  { planLoading && <Skeleton height="150" width="100%" mt="30px"/>}
                  { !planLoading &&
                  <div>
                    { planData?.SubscriptionPlan && (
                        <>
                          <div className="text-xl mt-[10px]">{planData.SubscriptionDetails.name} Monthly Plan - <small>{planData.SubscriptionDetails.price}USD/Month</small></div>
                          <CardDescription>
                           <ul className="mt-[10px] pl-[20px]">
                            { JSON.parse(planData.SubscriptionDetails.features).map((feature:string, index:number) => 
                              (<li key={index}>{feature}</li>)
                            )}
                           </ul>
                           </CardDescription>
                           <button className="mt-[30px] bg-[#33d6e2] text-[#141824] border-none rounded-lg py-2 px-3 font-semibold cursor-pointer" onClick={() => onLoadCustomerPortal()}>Cancel plan</button>
                        </>
                     )
                     }
                   </div>
                   }
                </CardHeader>
                
              </Card>
            </div>

          </div>
        </div>
      </Flex>
    </>
  );
};
