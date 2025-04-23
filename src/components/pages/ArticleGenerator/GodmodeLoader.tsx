import {
  CircularProgress,
  CircularProgressLabel,
  Text,
  VStack,
} from "@chakra-ui/react";

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

interface GodmodeLoaderProps {
  isProcessing: boolean;
  progress: number; // 0 to 100
}

const GodmodeLoader = ({ isProcessing, progress }: GodmodeLoaderProps) => {
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

  const { label } = getCurrentStep();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
      <VStack spacing={4}>
        <CircularProgress
          value={progress}
          size="200px"
          thickness="3px"
          color="teal.400"
        >
          <CircularProgressLabel fontSize="xl">
            {progress.toFixed(1)}%
          </CircularProgressLabel>
        </CircularProgress>
        { progress < 100 && (
          <Text fontSize="md" className="text-slate-500">
           {label}...
          </Text>
        )}
      </VStack>
    </div>
  );
};

export default GodmodeLoader;