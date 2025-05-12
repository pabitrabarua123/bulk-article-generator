import {
  CircularProgress,
  CircularProgressLabel,
  Text,
  VStack,
  Spinner,
  useColorModeValue,
  Button,
  Box,
  Flex,
  keyframes
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

// 🆕 Added "Composing Final Article" step
const steps = [
  "Understanding Keyword",
  "Researching",
  "Writing Outline",
  "Composing First Draft",
  "Adding Facts",
  "Adding Citations and Links",
  "Composing Images",
  "Writing Final Draft",
  "SEO Optimization",
  "Writing Meta Tags",
  "Composing Final Article"
];

const TOTAL_DURATION = 1500; // in seconds (25 minutes)
const EARLY_PHASE_DURATION = 10; // First 3 steps: total 30 seconds
const LATE_PHASE_STEP_DURATION = (TOTAL_DURATION - EARLY_PHASE_DURATION) / (steps.length - 3); 
// dynamically split remaining time among remaining steps

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

interface GodmodeLoaderProps {
  isProcessing: boolean;
  progress: number; // 0 to 100
}

const GodmodeLoader = ({ isProcessing, progress }: GodmodeLoaderProps) => {
  const spinnerColor = useColorModeValue("blackAlpha.300", "whiteAlpha.300");
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const router = useRouter();

  if (!isProcessing) return null;

  const elapsed = (progress / 100) * TOTAL_DURATION;
  const remaining = TOTAL_DURATION - elapsed;
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  const getCurrentStep = () => {
    if (elapsed < EARLY_PHASE_DURATION) {
      const stepIndex = Math.floor(elapsed / 10); // 3 steps, 10s each
      return {
        label: steps[stepIndex],
        index: stepIndex,
      };
    } else {
      const adjustedElapsed = elapsed - EARLY_PHASE_DURATION;
      const stepIndex = Math.min(
        3 + Math.floor(adjustedElapsed / LATE_PHASE_STEP_DURATION),
        steps.length - 1
      );
      return {
        label: steps[stepIndex],
        index: stepIndex,
      };
    }
  };

  const { label, index } = getCurrentStep();

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.7)"
      zIndex={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg={bgColor}
        p={8}
        borderRadius="xl"
        boxShadow="2xl"
        maxW="500px"
        w="90%"
        // animation={`${pulse} 2s infinite`}
      >
        <VStack spacing={6}>
          <CircularProgress
            value={progress}
            size="180px"
            thickness="4px"
            color="teal.400"
            trackColor="gray.200"
          >
            <CircularProgressLabel fontSize="2xl" fontWeight="bold">
              {progress.toFixed(1)}%
            </CircularProgressLabel>
          </CircularProgress>

          {progress < 100 && (
            <>
              <Text fontSize="sm" color={textColor} textAlign="center">
                Your complete batch of articles will be ready in just 20 minutes.
              </Text>

              <Flex alignItems="center" justifyContent="center" mb={2}>
                <Spinner size="sm" color="teal.400" mr={3} />
                <Text fontSize="md" fontWeight="medium" color={textColor}>
                  {label}...
                </Text>
              </Flex>

              <Text fontSize="sm" color={textColor} textAlign="center">
                We will notify you via email once it&apos;s completed.
                You may go to the dashboard and continue with your work.
              </Text>

              <Button
                colorScheme="teal"
                size="lg"
                onClick={() => router.push('/dashboard')}
                w="100%"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default GodmodeLoader;