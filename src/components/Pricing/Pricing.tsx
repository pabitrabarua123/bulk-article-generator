"use client";

import { Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { PricingPlan } from "./PricingPlan";
import { useRouter } from "next/navigation";
import { Section } from "../atoms/Section/Section";
import { useState } from "react";
import { pricingPlans } from "@/config";
import { useColorModeValues } from "@/hooks/useColorModeValues";
import { useQuery } from "@tanstack/react-query";

export const Pricing = () => {
  const router = useRouter();
  const { primaryTextColor, secondaryTextColor, borderColor } =
    useColorModeValues();
  const [planType, setPlanType] = useState<"monthly" | "annual">("annual");
  const isMonthly = planType === "monthly";

  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);

  const { data: productData, isLoading: isLoadingPrice, error: errorPrice } = useQuery({
      queryKey: ["products"],
      queryFn: async () => {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      }
    });
  
    const allPlans = [
      ...(productData?.subscriptionPlans || []),
      ...(productData?.lifetimePlans || []),
    ];
    console.log(allPlans);

    const [activeTab, setActiveTab] = useState<string>("monthly")
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const handleTabClick = (tab: string): void => {
      setActiveTab(tab);
    };

    const payStripeSubscription = async (priceId: string, name: string) => {
      setProcessingPlan(priceId);
      try {
        const response = await fetch("/api/subscriptions/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, name }), 
        });
  
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const { url } = await response.json();
        window.location.href = url;
      } catch (error:any) {
        console.error("Fetch error:", error);
        return { error: error.message };
      }
    }; 
  
    const payStripeLifetime = async (priceId: string, name: string) => {
      setProcessingPlan(priceId);
      try {
        const response = await fetch("/api/lifetimePurchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, name }), 
        });
  
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const { url } = await response.json();
        window.location.href = url;
      } catch (error:any) {
        console.error("Fetch error:", error);
        return { error: error.message };
      }
    };

  return (
    <>
      <Section flexDir="column" id="pricing">
        <Heading as="h4" fontSize="16px" color="brand.400" mb="16px">
          Pricing
        </Heading>
        <Heading
          as="h2"
          fontSize={["26px", "40px", "48px"]}
          lineHeight={["32px", "48px", "56px"]}
          mb="32px"
          fontWeight="extrabold"
          textAlign="center"
        >
          Upgrade your plan
        </Heading>

      </Section>
      {isLoadingPrice && 
      <Text my="5px" textAlign="center">
        Loading plans...
      </Text>
      }
      { !isLoadingPrice &&
        <Flex
        mt="5px"
        fontSize="14px"
        color={secondaryTextColor}
        justifyContent="center"
        className="mx-auto"
        >
        <Text ml="5px" mr="5px">All plans include a</Text>
        <Text textDecor={isMonthly ? "line-through" : "none"} color="brand.400">
          7-day money-back guarantee.
        </Text>
        <Text ml="5px">Need help choosing? Contact our support team.</Text>
        </Flex>
      }
      {!isLoadingPrice &&
            <Section mt="60px" alignItems="center" className="block max-w-[1000px] my-5 mx-auto">
            {/* Tabs */}
            <div className="flex justify-center p-4">
              <div className="flex">
                <button 
                  className={`px-5 py-2 font-medium border border-[rgba(255,255,255,0.2)] 
                    ${activeTab === 'monthly' 
                      ? 'bg-[#33d6e2] border-[#33d6e2] text-[#141824] font-semibold' 
                      : 'bg-transparent text-white'} 
                    rounded-l-lg cursor-pointer`}
                  onClick={() => handleTabClick('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`px-5 py-2 font-medium border border-[rgba(255,255,255,0.2)] 
                    ${activeTab === 'onetime' 
                      ? 'bg-[#33d6e2] border-[#33d6e2] text-[#141824] font-semibold' 
                      : 'bg-transparent text-white'} 
                    rounded-r-lg cursor-pointer`}
                  onClick={() => handleTabClick('onetime')}
                >
                  One-time Payment
                </button>
              </div>
            </div>
    
            {/* Content Area with Plans */}
            <div className="overflow-y-auto">
              {activeTab === 'monthly' ? (
                <div className="flex flex-col md:flex-row p-4 md:p-6 gap-4">
    { productData?.subscriptionPlans &&
      productData?.subscriptionPlans.map((plan: {id: number; name: string; productId: string; priceId: string; price: number; features: string}) => (
      <div key={plan.id} className="bg-[#1e2434] rounded-lg flex-1 p-6 border border-[rgba(255,255,255,0.1)] relative min-h-[380px] hover:transform hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 hover:border-[#33d6e2]">
        { plan.name === 'Premium' &&
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#33d6e2] text-[#141824] text-xs font-semibold py-1 px-2.5 rounded-xl uppercase">
            Most Popular
          </div>
        }
        <div className="mb-4">
          <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
        </div>
        <div className="text-3xl font-bold my-2">
          <span className="text-base align-top relative top-0.5">$</span>{plan.price}
          <span className="text-sm font-normal text-[#8990a5]">/month</span>
        </div>
        <ul className="list-none p-0 my-6 mb-[70px]">
      {plan.features
        ? JSON.parse(plan.features).map((feature: string, index: number) => {
            const match = feature.match(/^(\d+|Unlimited)\s(.+)$/); // Extracts number and text part
            return (
              <li key={index} className="py-2 flex items-start text-[#8990a5] text-sm leading-tight">
                <span className="text-[#33d6e2] mr-2 font-bold flex-shrink-0">✓</span>
                {match ? (
                  <span>
                    <span className="text-[#33d6e2] font-medium">{match[1]}</span> {match[2]}
                  </span>
                ) : (
                  <span>{feature}</span> // If no number detected, show feature as is
                )}
              </li>
            );
          })
        : null}
    </ul>
        <button  
          onClick={() => payStripeSubscription(plan.priceId, plan.name)} 
          className="absolute bottom-6 left-6 right-6 bg-[#33d6e2] text-[#141824] border-none rounded-lg py-3 font-semibold cursor-pointer hover:opacity-90 hover:transform hover:translate-y-[-2px] transition-all duration-200"
          disabled={processingPlan === plan.priceId}
        >
          { processingPlan === plan.priceId ? 'Processing Payment...' : 'Upgrade Now'}
        </button>
      </div>
      ))
    }            
                </div>
              ) : (
                <div className="flex flex-col md:flex-row p-4 md:p-6 gap-4">
    { productData?.lifetimePlans &&
      productData?.lifetimePlans.map((plan: {id: number; name: string; productId: string; priceId: string; price: number; features: string}) => (
      <div key={plan.id} className="bg-[#1e2434] rounded-lg flex-1 p-6 border border-[rgba(255,255,255,0.1)] relative min-h-[380px] hover:transform hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 hover:border-[#33d6e2]">
        { plan.name === 'Premium' &&
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#33d6e2] text-[#141824] text-xs font-semibold py-1 px-2.5 rounded-xl uppercase">
            Most Popular
          </div>
        }
        <div className="mb-4">
          <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
        </div>
        <div className="text-3xl font-bold my-2">
          <span className="text-base align-top relative top-0.5">$</span>{plan.price}
          <span className="text-sm font-normal text-[#8990a5]"></span>
        </div>
        <ul className="list-none p-0 my-6 mb-[70px]">
      {plan.features
        ? JSON.parse(plan.features).map((feature: string, index: number) => {
            const match = feature.match(/^(\d+|Unlimited)\s(.+)$/); // Extracts number and text part
            return (
              <li key={index} className="py-2 flex items-start text-[#8990a5] text-sm leading-tight">
                <span className="text-[#33d6e2] mr-2 font-bold flex-shrink-0">✓</span>
                {match ? (
                  <span>
                    <span className="text-[#33d6e2] font-medium">{match[1]}</span> {match[2]}
                  </span>
                ) : (
                  <span>{feature}</span> // If no number detected, show feature as is
                )}
              </li>
            );
          })
        : null}
    </ul>
       <button  
          onClick={() => payStripeLifetime(plan.priceId, plan.name)} 
          className="absolute bottom-6 left-6 right-6 bg-[#33d6e2] text-[#141824] border-none rounded-lg py-3 font-semibold cursor-pointer hover:opacity-90 hover:transform hover:translate-y-[-2px] transition-all duration-200"
          disabled={processingPlan === plan.priceId}
        >
          { processingPlan === plan.priceId ? 'Processing Payment...' : 'Upgrade Now'}
        </button>
      </div>
      ))
    }
                </div>
              )}
            </div>
          </Section>
      }
    </>
  );
};
