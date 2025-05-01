import React, { useEffect, useState, useRef } from "react";
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
  Box,
  Spinner,
  useColorModeValue
} from "@chakra-ui/react";
import {
  TbPlus
} from "react-icons/tb";
import { LuTimerReset } from "react-icons/lu";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { User } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
//import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import GodmodeLoader from "./GodmodeLoader";

const ArticleGenerator: React.FC = () => {
  
  const router = useRouter();
  const [isEditPromptDialogOpen, setIsEditPromptDialogOpen] = React.useState(false);
  //const [todoToEdit, setTodoToEdit] = React.useState<Todo | null>(null);
  
  const searchParams = useSearchParams();
  const param = searchParams.get("payment"); 
  useEffect(() => {
    if(param === 'success') {
      const type = searchParams.get("type");
      const plan = searchParams.get("plan");
      if(type === 'subscription'){
        toast.success(`You have been successfully upgraded to "${plan} Monthly Plan"`);
      }else{
        toast.success(`You have been successfully upgraded to "${plan} Lifetime Plan"`);
      }
    }else if(param === 'failed'){
      toast.success("Your Payment has failed (Please Try again)");
    }
  }, [param]);

  const spinnerColor = useColorModeValue("blackAlpha.300", "whiteAlpha.300");

  // Create a reference to store the AbortController so it can be accessed in all functions
  const abortControllerRef = useRef<AbortController>(new AbortController());

  // Create a cleanup function when component unmounts or navigation occurs
  useEffect(() => {
    // Reset abort controller on mount
    abortControllerRef.current = new AbortController();
    
    return () => {
      // Cleanup function to abort all fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear any intervals to prevent memory leaks
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Reset processing states to prevent UI from hanging
      setIsProcessing(false);
      setIsProcessingGodmode(false);
      setGodModeLoader(false);
    };
  }, []);

  // Listen for navigation events and abort pending requests
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const {
      data: userData,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["user"],
      queryFn: async () => {
        const response = await fetch('/api/user', {
          signal: abortControllerRef.current.signal,
        });
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
 // console.log(user);

  const openPromptDialog = () => {
    setIsEditPromptDialogOpen(true);
  };

  const closeEditPromptDialog = () => {
   // setTodoToEdit(null);
    setIsEditPromptDialogOpen(false);
  };
  
  const [text, setText] = useState('');
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const [prompt, setPrompt] = useState("Write a detailed and information-dense and seo optimized article in English for the keyword {KEYWORD} in html using clear, language without unnecessary grandiose or exaggerations for newspaper. Write article with subheadings formatted in HTML without head or title.");
  const batchRef = useRef("");
  const handleBatchChange = (val: string) => {
    batchRef.current = val; // No re-render happens
  };

  const generateArticle = useMutation({
    mutationFn: async (keyword: { batch: string, text: string, prompt: string, is_godmode: boolean }) => {
      const response = await fetch("/api/article-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keyword),
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) {
        throw new Error("Failed to create article");
      }
      return response.json();
    },
    onSuccess: (data) => {
      //toast.success("Article generated successfully for Keyword: ");
    },
    onError: (error) => {
      // If the error is an abort error, don't show the toast
      if (error.name !== 'AbortError') {
        toast.error("Error creating article");
      }
    },
  });

  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendKeywordsSequentially = async (keywords: string[]) => {
    if(balance.credits == 0) {
      openTimerPopup();
      return;
    }
    if(keywords.length > balance.credits){
       toast.error("Keywords Length is greater than the balance");
       return;
    }
    if(keywords.length === 0){
       toast.error("Please enter Keywords");
      return;
    }
    if(keywords.length > 10) {
     toast.error("Maximum allowed Keywords(10) exceeds!");
     return;
    }

    setIsProcessing(true);

    const batchValue = batchRef.current && batchRef.current.trim() !== ''
    ? batchRef.current
    : "Batch_" + (Math.floor(Math.random() * 9000) + 1000);

    try {
      const response = await fetch('/api/article-generator/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({batch: batchValue }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();
      batchRef.current = data.assignedBatch;

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 0.3, 95)); // Slow continuous progress
      }, 1000);

      for (let i = 0; i < keywords.length; i++) {
        // Check if the request was aborted
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Request aborted');
        }

        setCurrentKeyword(keywords[i]);
        try {
          await generateArticle.mutateAsync({
            batch: batchRef.current,
            text: keywords[i],
            prompt: prompt,
            is_godmode: isGodMode,
          });
        } catch (error: any) {
          // If the request was aborted, stop the loop
          if (error.name === 'AbortError' || abortControllerRef.current.signal.aborted) {
            clearInterval(interval);
            setIsProcessing(false);
            return;
          }
          console.error(`Error processing keyword "${keywords[i]}":`, error);
          toast.error(`Error creating article for the keyword: "${keywords[i]}"`);
        }
        
        let progressPercent = ((i + 1) / keywords.length) * 100;
        setProgress(progressPercent); // Jump to the actual progress when result is received
      }
      
      clearInterval(interval);
      updateBalance(keywords.length);
      
      // Only navigate if the component is still mounted and the request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        router.push(`/articles?batch=${batchRef.current}`);
      }
    } catch (error: any) {
      // Handle abort errors silently
      if (error.name !== 'AbortError' && error.message !== 'Request aborted') {
        console.error("Error:", error);
        toast.error("Error processing keywords");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const godModeArticleIds = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [godmodeArticlePrepared, setGodmodeArticlePrepared] = useState([]);
  const [godmodeArticleRemain, setGodmodeArticleRemain] = useState(0);
  const [godmodeStatus, setGodmodeStatus] = useState('');
  const [isProcessingGodmode, setIsProcessingGodmode] = useState(false);
  const [progressGodmode, setProgressGodmode] = useState(0);
  const [GodModeLoader, setGodModeLoader] = useState(false);
  const redirectReadyRef = useRef(false);

  const sendKeywordsSequentiallyGodmode = async (keywords: string[]) => {
    if (balance.credits == 0) {
      openTimerPopup();
      return;
    }
    if (keywords.length > balance.credits) {
      toast.error("Keywords Length is greater than the balance");
      return;
    }
    if (keywords.length === 0) {
      toast.error("Please enter Keywords");
      return;
    }
    if (keywords.length > 10) {
      toast.error("Maximum allowed Keywords(10) exceeds!");
      return;
    }
  
    setIsProcessingGodmode(true);
    setGodModeLoader(true);
    start25MinLoader(); // 🔥 Start the 25-min loader here

    try {
      const batchValue = batchRef.current && batchRef.current.trim() !== ''
      ? batchRef.current
      : "Batch_" + (Math.floor(Math.random() * 9000) + 1000);

      const response = await fetch('/api/article-generator/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({batch: batchValue }),
        signal: abortControllerRef.current.signal,
      });

      // Check if the request was aborted
      if (abortControllerRef.current.signal.aborted) {
        throw new Error('Request aborted');
      }

      const data = await response.json();
      batchRef.current = data.assignedBatch;
    
      const res = await generateArticle.mutateAsync({
        batch: batchRef.current,
        text: keywords.join('\n'),
        prompt: prompt,
        is_godmode: isGodMode,
      });
      
      // Store all article IDs
      godModeArticleIds.current = res.articles.map((article: any) => article.id);
      
      console.log(godModeArticleIds.current);
      updateBalance(keywords.length);
    } catch (error: any) {
      // Handle abort errors silently
      if (error.name !== 'AbortError' && error.message !== 'Request aborted') {
        console.error("Error processing keywords:", error);
        toast.error("Error creating articles");
      }
      
      // Always clean up when there's an error
      setIsProcessingGodmode(false);
      setGodModeLoader(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const start25MinLoader = () => {
    setProgressGodmode(0); // reset
    const duration = 1500; // 1500 seconds
    let secondsPassed = 0;
    let apiCalled = false; // ensure it's called only once
  
    if (timerRef.current) clearInterval(timerRef.current);
  
    timerRef.current = setInterval(() => {
      // Check if the request was aborted
      if (abortControllerRef.current.signal.aborted) {
        clearInterval(timerRef.current!);
        return;
      }

      secondsPassed++;
      const percent = (secondsPassed / duration) * 100;
      setProgressGodmode(percent);
  
      const remaining = duration - secondsPassed;
  
      // Trigger API call when 60 seconds or less remain
      if (remaining <= 10 && !apiCalled) {
        apiCalled = true;
        checkArticlePrepared();
      }
  
      if (secondsPassed >= duration) {
        setGodModeLoader(false);
        clearInterval(timerRef.current!);
        redirectReadyRef.current = true;
      }
    }, 1000); // update every second
  };
  
  const checkArticlePrepared = () => {
    fetch("/api/article-generator/check-godmode-completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({keywords: godModeArticleIds.current}),
      signal: abortControllerRef.current.signal,
    }).then(response => response.json())
      .then(data => {
        console.log(data.res);
         if(data.res === 'Partial'){
           setGodmodeArticlePrepared(data.contentFilledKeywords);
           setGodmodeArticleRemain(data.remainingKeywords);
           setGodmodeStatus('Partial');
         }
         if(data.res === 'Full'){
           setGodmodeArticlePrepared(data.contentFilledKeywords);
           setGodmodeStatus('Full');
         }
         if(data.res === 'Incomplete'){
          setGodmodeArticleRemain(data.remainingKeywords);
          setGodmodeStatus('Incomplete');
         }
      })
      .catch(error => {
        // Ignore abort errors
        if (error.name !== 'AbortError') {
          console.error('Error:', error);
        }
      });
  }

  useEffect(() => {
    if (redirectReadyRef.current && godmodeArticleRemain === 0 && !GodModeLoader) {
      setTimeout(() => {
        router.push(`/articles?batch=${batchRef.current}`);
      }, 3000);
    }
  }, [godmodeArticleRemain, GodModeLoader]);
  

  const updateBalance = async (no_of_keyword: number) => {
    try {
      const response = await fetch("/api/article-generator", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'update_balance', 
          no_of_keyword: no_of_keyword, 
          balance: balance.credits, 
          balance_type: balance.balance_type,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      const data = await response.json();
      if(data.status === 'success'){
          setBalance({...balance, credits: balance.credits - no_of_keyword});
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
      }
    }
  }

  const [isPricingPopupOpen, setIsPricingPopupOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("monthly")
  
  const openPricingPopup = (): void => {
    setIsPricingPopupOpen(true);
  };

  const closePricingPopup = (): void => {
   setIsPricingPopupOpen(false);
  };

  const [isTimerPopupOpen, setIsTimerPopupOpen] = useState<boolean>(false);

  const openTimerPopup = (): void => {
    setIsTimerPopupOpen(true);
  };

  const closeTimerPopup = (): void => {
   setIsTimerPopupOpen(false);
  };

  const [isGodMode, setIsGodMode] = useState<boolean>(true);
  const toggleMode = () => {
    setIsGodMode(!isGodMode);
  };

  const [showGodModeAlert, setShowGodModeAlert] = useState<boolean>(true);
  const [balance, setBalance] = useState({credits: 0, balance_type: '', balance_text: ''});

  useEffect(() => {
    if (isGodMode) {
      setShowGodModeAlert(true);
      if(user && user?.monthyBalance > 0) {
        setBalance({...balance, credits: user.monthyBalance, balance_type: 'monthyBalance', balance_text: 'Monthly Balance'})
      }else if(user && user.lifetimeBalance > 0){
        setBalance({...balance, credits: user.lifetimeBalance, balance_type: 'lifetimeBalance', balance_text: 'Lifetime Balance'})
      }else{
        setBalance({...balance, credits: user?.trialBalance? user.trialBalance : 0, balance_type: 'trialBalance', balance_text: 'Trial Balance'})
      }
    }else{
      console.log('hit hgere');
      if(user && user?.LiteModeBalance > 0){
        setBalance({...balance, credits: user.LiteModeBalance, balance_type: 'LiteModeBalance', balance_text: 'Balance'})
      }else{
        setBalance({...balance, credits: user?.dailyBalance? user.dailyBalance : 0, balance_type: 'dailyBalance', balance_text: 'Daily Balance'})
      }
    }
  }, [isGodMode, user]);


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

  //console.log(productData);

  return (
    <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
      <VStack align="flex-start" spacing={4}>
        <Heading size="md">Generate Articles</Heading>
        <Text className="text-slate-500 text-sm">
          Enter Keywords one per line and generate article
        </Text>

<Flex width="100%" justifyContent="space-between" alignItems="center" mb={0}>
  <Flex alignItems="center" gap={2}>
    <Text fontSize="sm" fontWeight="medium">Lite Mode</Text>
    <Switch 
      size="md" 
      colorScheme="cyan" 
      isChecked={isGodMode} 
      onChange={toggleMode} 
    />
    <Text fontSize="sm" fontWeight="medium">God Mode</Text>
  </Flex>
  
{isGodMode && (
<Flex direction="column" alignItems="flex-end">
  { isLoading ?
  <Spinner size="xs" color={spinnerColor} mr="16px" /> 
  :
  <>
  <Text fontSize="sm" color="gray.600">{balance.balance_text}: {balance.credits} Articles</Text>
  { user && user?.monthyBalance === 0 && user && user?.lifetimeBalance === 0 &&
  <Text
  fontSize="sm"
  color="blue.500"
  textDecoration="underline"
  onClick={openPricingPopup}
  cursor="pointer"
  >
    Buy more credits
  </Text>
  }
  </>
}

</Flex>
  )}
</Flex>

{!isGodMode && (
<Flex gap={2} width="100%" height="37px" justifyContent="space-between" alignItems="center" mb={2}>
  <Button
    onClick={() => openPromptDialog()}
    size="sm"
    leftIcon={<TbPlus />}
    minW="160px"
    variant="solid"
    className="text-slate-500 custom-btn-1"
  >
    Change Prompt
  </Button>
  <Text fontSize="sm" color="gray.600">
    { isLoading ? <Spinner size="xs" color={spinnerColor} mr="16px" /> 
    : 
    <>
    {balance.balance_text}: {balance.credits + ' Articles'}{ user && user?.LiteModeBalance > 0 ? '' : '/30 Articles'}
    </>
    }
  </Text>
</Flex>
)}
        <div className="items-center gap-2 w-full mt-4">
          <Input
            placeholder="Batch name (Optional)"
            defaultValue={batchRef.current}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="rounded-md w-1/2 flex-grow text-slate-500"
          />
        </div>

        {isGodMode && showGodModeAlert && (
  <Box 
    position="relative"
    width="100%" 
    borderRadius="md"
    p={2}
    mb={1}
    className="godmode-notification"
  >
    <Flex alignItems="center">
      <Box color="yellow.400" fontSize="xl" mr={3}>
        <svg width="20" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0L0 20H12L8 32L24 12H12L16 0H12Z" fill="currentColor"/>
        </svg>
      </Box>
      <Text className="text-slate-500" fontSize="xs">
        Get ready to get insane quality articles made after SERP Analysis, LSI Keywords, Competitor analysis, Deep research and understanding
      </Text>
      <Box 
        position="absolute" 
        top={-2} 
        right={-2} 
        color="blue.400"
        cursor="pointer"
        onClick={() => setShowGodModeAlert(false)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Box>
    </Flex>
  </Box>
)}

        <div className="rounded-md w-full">
          <Textarea
            className="wtext-sm rounded-md w-full flex-grow text-slate-500 ca"
            placeholder="Keywords (Add 1 Per Line)"
            height="250px"
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
            onClick={() =>
              isGodMode
                ? sendKeywordsSequentiallyGodmode(lines)
                : sendKeywordsSequentially(lines)
            }
            disabled={isProcessing} >
            {isProcessing ? 'Generating...' : 'Generate'}
        </Button>

{isProcessing && !isGodMode &&
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
       { isProcessingGodmode && isGodMode && 
         <div className="godmod-progress fixed inset-0 z-50 flex items-center justify-center">
           <GodmodeLoader progress={progressGodmode} isProcessing={GodModeLoader} />
           { !GodModeLoader && godmodeStatus === 'Full' &&
             <Text className="text-slate-500">Articles generated successfully, redirecting to article list...</Text> 
           }
           { !GodModeLoader && godmodeStatus === 'Partial' &&
             <VStack spacing={2}>
              <Text className="text-slate-500">
               {godmodeArticlePrepared.length} Articles Completed. {godmodeArticleRemain} articles are still in progress, we will email you when completed.
              </Text>
              <br/>
              <Button
               colorScheme="brand"
               size="sm"
               onClick={() => setIsProcessingGodmode(false)}
              >
               Generate New Article
              </Button>
             </VStack>
           }
           { !GodModeLoader && godmodeStatus === 'Incomplete' &&
             <VStack spacing={2}>
              <Text className="text-slate-500">
               {godmodeArticleRemain} articles Generated on God mode will be completed in another 20 minutes.
              </Text>
              <br/>
              <Button
               colorScheme="brand"
               size="sm"
               onClick={() => setIsProcessingGodmode(false)}
              >
               Generate New Article
              </Button>
             </VStack>
           }
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

     {isPricingPopupOpen && (
       <PricingPopup 
         isOpen={isPricingPopupOpen} 
         onClose={closePricingPopup}
         activeTab={activeTab}
         setActiveTab={setActiveTab}
         productData={productData} 
         isLoadingPrice={isLoadingPrice}
         errorPrice={errorPrice}
        />
     )}

     {isTimerPopupOpen && (
       <TimerPopup 
         isOpen={isTimerPopupOpen} 
         onClose={closeTimerPopup}
         openPricingPopup={openPricingPopup}
        />
     )}

    </Container>
  );
};

export default ArticleGenerator;

const TimerPopup = ({
  isOpen,
  onClose,
  openPricingPopup
}: {
  isOpen: boolean;
  onClose: () => void;
  openPricingPopup: () => void;
}) => {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <div className="grid gap-4 py-4">
          <div className="flex items-center">
            <div style={{textAlign: 'center', width: '100%'}}>
             <LuTimerReset style={{fontSize: '100px', color: '#76e4f7', display: 'inline'}}/>
             <br/><br/>
             <p>Credits will refill in next</p>
             <p>24 hours</p>
             <br/>
             <Button
               type="button"
               colorScheme="brand"
               onClick={async () => {
                 openPricingPopup();
                 onClose();
               }}
             >
              Upgrade
             </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
            Update your prompt. Please do not remove the variable &#123;KEYWORD&#125;
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

interface SubscriptionPlan {
  id: number;
  name: string;
  productId: string;
  priceId: string;
  price: number;
  features: string;
}

interface ProductData {
  subscriptionPlans?: SubscriptionPlan[];
  lifetimePlans?: SubscriptionPlan[]; // Add this if lifetimePlans also exists
}

interface PricingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  productData: ProductData,
  isLoadingPrice: boolean,
  errorPrice: Error | null,
}

const PricingPopup: React.FC<PricingPopupProps> = ({ isOpen, onClose, activeTab, setActiveTab, productData, isLoadingPrice, errorPrice }) => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-[#1a1f2e] rounded-lg w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 text-center border-b border-opacity-10 border-white relative">
          <button 
            className="absolute top-4 right-4 text-[#8990a5] text-2xl bg-transparent border-none cursor-pointer hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-2xl font-semibold m-0">Upgrade Plan</h2>
        </div>

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
              {isLoadingPrice && 'Loading plans...'}

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

        {/* Footer */}
        <div className="p-4 text-center bg-[#141824] text-sm text-[#8990a5]">
          All plans include a 7-day money-back guarantee. Need help choosing? Contact our support team.
        </div>
      </div>
    </div>
  );
};
