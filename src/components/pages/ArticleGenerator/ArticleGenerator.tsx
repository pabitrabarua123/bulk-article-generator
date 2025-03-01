import React, { useState } from "react";
import {
  Button,
  Text,
  Flex,
  Container,
  Heading,
  VStack,
  Input,
  Textarea,
  Switch,
} from "@chakra-ui/react";
import {
  TbArrowBack,
  TbArrowDown,
  TbArrowUp,
  TbCheck,
  TbChevronDown,
  TbDots,
  TbPencil,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Todo } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const ArticleGenerator: React.FC = () => {
  
  const router = useRouter();
  const [isEditPromptDialogOpen, setIsEditPromptDialogOpen] = React.useState(false);
  const [todoToEdit, setTodoToEdit] = React.useState<Todo | null>(null);

  const openPromptDialog = () => {
    setIsEditPromptDialogOpen(true);
  };

  const closeEditPromptDialog = () => {
    setTodoToEdit(null);
    setIsEditPromptDialogOpen(false);
  };
  
  const [text, setText] = useState('');
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const [prompt, setPrompt] = useState("Write a detailed and information-dense and seo optimized article in English for the keyword KEYWORD in the style of Ernest Hemingway in html. using clear, language without unnecessary grandiose or exaggerations for newspaper. Get to the point, and avoid overly complex or flowery phrasing. Don't use the most natural words. Use the words unique, ensure and utmost less than 3 times. Write article with subheadings formatted in HTML without head or title.");
  const [batch, setBatch] = useState('');

  const generateArticle = useMutation({
    mutationFn: async (keyword: { batch: string, text: string, prompt: string }) => {
      const response = await fetch("/api/article-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keyword),
      });
      if (!response.ok) {
        throw new Error("Failed to create todo");
      }
      return response.json();
    },
    onSuccess: (data) => {
      //toast.success("Article generated successfully for Keyword: ");
    },
    onError: (error) => {
      toast.error("Error creating article");
    },
  });

  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendKeywordsSequentially = async (keywords: string[]) => {
    setIsProcessing(true);
        
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.3, 95)); // Slow continuous progress
    }, 1000);

    for (let i = 0; i < keywords.length; i++) {
      setCurrentKeyword(keywords[i]);
      try {
        await generateArticle.mutateAsync({
          batch: batch !== "" ? batch : "Untitled",
          text: keywords[i],
          prompt: prompt,
        });
      } catch (error) {
        console.error(`Error processing keyword "${keywords[i]}":`, error);
        toast.error(`Error creating article for the keyword: "${keywords[i]}"`);
      }
      
      let progressPercent = ((i + 1) / keywords.length) * 100;
      setProgress(progressPercent); // Jump to the actual progress when result is received
    }
    setIsProcessing(false);
    clearInterval(interval);
    router.push(`/articles?batch=${batch}`);
    console.log("All requests finished!");
  };


  return (
    <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
      <VStack align="flex-start" spacing={4}>
        <Heading size="md">Generate Articles</Heading>
       <Text className="text-slate-500 text-sm">
          Enter Keywords one per line and generate article
        </Text>
        <Flex gap={2}>
          <Button
            onClick={() => openPromptDialog()}
            size="sm"
            leftIcon={<TbPlus />}
            minW="160px"
            variant="solid"
            className="text-slate-500"
          >
            Change Prompt
          </Button>
        </Flex>

        <div className="items-center gap-2 w-full mt-4">
          <Input
            placeholder="Batch name (Optional)"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="text-sm rounded-md w-1/2 flex-grow"
            size="sm"
          />
        </div>

        <div className="rounded-md w-full">
          <Textarea
            className="wtext-sm rounded-md w-full flex-grow"
            placeholder="Keywords (Add 1 Per Line)"
            height="200px"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          { lines.length > 0 &&
          <p className="mt-2 text-slate-500 text-sm">Keywords Added: {lines.length} | Estimated Time: { lines.length*30 > 60 ? lines.length*30/60 + ' minutes' : lines.length*30 + ' seconds'}</p>
          }
        </div>
        <Button
            type="submit"
            colorScheme="brand"
            onClick={() => sendKeywordsSequentially(lines)}
            disabled={isProcessing}          >
            {isProcessing ? 'Generating...' : 'Generate'}
          </Button>
{isProcessing &&
    <div style={{ width: "100%", marginTop: '20px' }}>
    {/* <h3>{isProcessing ? `Processing: ${currentKeyword}` : "All keywords processed!"}</h3> */}
    <div style={{ width: "100%", backgroundColor: "#f0f0f0", borderRadius: "10px" }}>
      <div
        style={{
          width: `${progress}%`,
          height: "5px",
          backgroundColor: "#9decf9",
          borderRadius: "10px",
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
    <p className="mt-2 text-slate-500 text-sm">{Math.round(progress)}% Complete</p>
  </div>
}

      </VStack>

      {isEditPromptDialogOpen && (
        <EditPromptDialog
          isOpen={isEditPromptDialogOpen}
          onClose={closeEditPromptDialog}
          prompt={prompt}
          setPrompt={setPrompt}
        />
      )}
    </Container>
  );
};

export default ArticleGenerator;

const EditPromptDialog = ({
  isOpen,
  onClose,
  prompt,
  setPrompt
}: {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (value: string) => void;
}) => {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
          <DialogDescription>
            Update your prompt, do not chnage KEYWORD.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
            <Textarea
              className="wtext-sm rounded-md w-full flex-grow"
              placeholder="Keywords (Add 1 Per Line)"
              height="200px"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            colorScheme="brand"
            onClick={async () => {
              onClose();
            }}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
