"use client";

import { CrispChat } from "@/components/CustomerSupport/CrispChat";
import { UserdeskChat } from "@/components/CustomerSupport/UserdeskChat";
import { LemonSqueezyAffiliateScript } from "@/components/LemonSqueezyAffiliateScript/LemonSqueezyAffiliateScript";
import { customTheme } from "@/theme";
import { CacheProvider } from "@chakra-ui/next-js";
import {
  ChakraProvider,
  ColorModeScript,
  cookieStorageManager,
} from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const queryClient = new QueryClient();

// Custom hook to handle route changes and cancel queries
export function useRouteChangeHandler() {
  const pathname = usePathname();
  
  useEffect(() => {
    // When the route changes, cancel all pending queries
    return () => {
      // This runs when the pathname changes (navigation)
      queryClient.cancelQueries();
    };
  }, [pathname]);
  
  return null;
}

export function Providers({
  children,
  uiColorMode,
}: {
  children: React.ReactNode;
  uiColorMode: "light" | "dark";
}) {
  const theme = {
    ...customTheme,
    config: {
      ...customTheme.config,
      initialColorMode: uiColorMode,
    },
  };

  return (
    <SessionProvider>
      <Toaster />
      <UserdeskChat />
      <CrispChat />
      <LemonSqueezyAffiliateScript />
      <QueryClientProvider client={queryClient}>
        <CacheProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme={uiColorMode}
            enableSystem
          >
            <ColorModeScript initialColorMode={uiColorMode} />
            <RouteChangeHandler />
            <ChakraProvider
              theme={theme}
              colorModeManager={cookieStorageManager}
            >
              {children}
            </ChakraProvider>
          </NextThemesProvider>
        </CacheProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Component to handle route changes
function RouteChangeHandler() {
  useRouteChangeHandler();
  return null;
}
