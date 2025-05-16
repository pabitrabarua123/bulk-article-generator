import { Flex } from "@chakra-ui/react";
import { TbRocket } from "react-icons/tb";
import { Box } from "@chakra-ui/react";

export const Logo1 = () => {
  return (
    <Box
      w="32px"
      h="32px"
      bgColor="#00B5D8"
      borderRadius="5px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        <path d="m15 5 3 3" />
      </svg>
    </Box>
  );
};

export const LogoSmall = () => {
  return (
    <Flex
      w="18px"
      h="18px"
      bgColor="brand.500"
      borderRadius="4px"
      alignItems="center"
      justifyContent="center"
      color="white"
    >
      <TbRocket size="14px" />
    </Flex>
  );
};
