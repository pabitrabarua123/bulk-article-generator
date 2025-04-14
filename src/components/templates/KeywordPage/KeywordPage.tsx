"use client";

import { SideBar, sidebarWidth } from "@/components/organisms/Sidebar/Sidebar";
import Keyword from "@/components/pages/Keyword/Keyword";
import { useMobile } from "@/hooks/useMobile";
import {
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { TbMenu2 } from "react-icons/tb";
import { Routes } from "@/data/routes";

type KeywordPageProps = {
  currentPage: Routes;
  id: string;
};

export const KeywordPage = ({ currentPage, id}: KeywordPageProps) => {
    console.log(id)
  const isMobile = useMobile();
  const { data: session, status } = useSession();

  return (
    <>
     {status === "loading" && 
      <Center minH="100vh">
       <Spinner color="brand.500" />
      </Center>
     }
     
     {status === "unauthenticated" && (
      <Center minH="100vh">
        <Stack>
          <Text>Sign in to access</Text>
          <Button as="a" href="/login" colorScheme="brand">
            Sign in
          </Button>
        </Stack>
        </Center>
      )}

      {status === "authenticated" && (
          <Flex
            minW="100vw"
            w="100vw"
            minH="100vh"
            margin="0"
            padding="0"
            pt="20px"
            pl="20px"
            pr="20px"
            pb="20px"
            flexGrow={1}
            justifyContent="flex-start"
            style={{
              marginInlineStart: "0",
              marginInlineEnd: "0",
            }}
          >
            <Keyword id={id} /> 
          </Flex>
      )}
    </>
  );
};
