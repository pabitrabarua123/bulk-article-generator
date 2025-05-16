import React, { useState, useEffect } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Image from 'next/image';
import {
  Button,
  Text,
  Flex,
  Container,
  Heading,
  VStack,
  Input,
  Switch,
  Box,
  Icon,
  useColorMode,
  useColorModeValue,
  Spinner
} from "@chakra-ui/react";
import {
  TbArrowBackUp,
  TbCopy,
  TbDeviceFloppy,
  TbArrowLeft
} from "react-icons/tb";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { GodmodeArticles } from "@prisma/client";
import { queryClient } from "@/app/providers";
import { useRouter } from "next/navigation";
import { HStack, Stack, Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react"
import Link from 'next/link';
import { Logo1 } from "../../atoms/Logo1/Logo1";
import ScoreMeter from './ScoreMeter';
import { MdCheckCircle, MdOutlineTextSnippet, MdAutoGraph, MdSmartToy } from 'react-icons/md';
import { syllable } from 'syllable';

const Keyword = ({id}: {id: string}) => {

  const { colorMode, toggleColorMode } = useColorMode();
  const spinnerColor = useColorModeValue("blackAlpha.300", "whiteAlpha.300");

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  const router = useRouter();
  const {
    data: todosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos", id],
    queryFn: async () => {
      const response = await fetch(`/api/article-generator?id=${id}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json() as Promise<{
        todos: (Omit<GodmodeArticles, "updatedAt"> & { updatedAt: string })[];
        batch_name: string;
      }>;
    }
  });

  const todos = React.useMemo(() => todosData?.todos || [], [todosData]);
  const batch_name = React.useMemo(() => todosData?.batch_name || '', [todosData]);
  console.log(batch_name);
  const [editorText, setEditorText] = React.useState('');
  const [featuredImage, setFeaturedImage] = useState<string | undefined>();
  const [wordCount, setWordCount] = useState(0);

  function getCount(str: string) {
    return str.split(' ').filter(function(num) {
     return num != ''
    }).length;
  }
  
  const [ReadabilityScore, setReadabilityScore] = useState<number | null>(null);

  function checkReadabilityScore(content: string): number | null {
    if (!content || typeof content !== 'string') return null;
    const { htmlToText } = require('html-to-text');
    const text = htmlToText(content, { wordwrap: false });
  
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);
    const syllables = words.reduce((acc: number, word: string) => acc + syllable(word), 0);
  
    const totalSentences = sentences.length;
    const totalWords = words.length;
  
    // Avoid division by zero
    if (totalSentences === 0 || totalWords === 0) return null;
  
    const fleschScore =
      206.835 -
      1.015 * (totalWords / totalSentences) -
      84.6 * (syllables / totalWords);
  
    return Number(fleschScore.toFixed(2));
  }

  useEffect(() => {
    if(todos[0]?.content){
      let content = todos[0]?.content;
      if(todos[0]?.featuredImage) {
        // Find the position after h1
        const h1EndIndex = content.indexOf('</h1>');
        if (h1EndIndex !== -1) {
          // Check if there's already an image after h1
          const contentAfterH1 = content.slice(h1EndIndex);
          const hasImageAfterH1 = contentAfterH1.includes('<img');
          
          if (!hasImageAfterH1) {
            const imageHtml = `<div><img src="${todos[0].featuredImage}" alt="Featured Image" class="rounded-md" style="max-width: 100%; height: auto; margin: 20px 0;" /></div>`;
            content = content.slice(0, h1EndIndex) + imageHtml + content.slice(h1EndIndex);
          }
        }
      }
      setEditorText(content);
      let count = getCount(content);
      setWordCount(count);
      setReadabilityScore(checkReadabilityScore(content));

      if(todos[0]?.aiScore){
        setAiCheck(todos[0]?.aiScore);
      }else{
        checkAI(content, true);
      }
    }
  }, [todos]);

  const updateTodoMutation = useMutation({
    mutationFn: async (updatedTodo: {
      id: string;
      content?: string;
      aiScore?: number | null;
      type: string
    }) => {
      const response = await fetch("/api/article-generator", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTodo),
      });
      if (!response.ok) {
        throw new Error("Failed to update article");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Article updated successfully");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      toast.error("Error updating article");
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateTodo = async (
    todo: {id: string, content: string, aiScore?: number | null, type: string}
  ) => {
    setIsSaving(true);
    try {
      await updateTodoMutation.mutateAsync(todo);
    } finally {
      setIsSaving(false);
    }
  };

  const copyContent = () => {
    const content = getHTMLContent("my-quill-editor");
    if (content) {
      copyToClipboard(content);
    }
  };
  
  const getHTMLContent = (nodeId: string): string | null => {
    const node = document.getElementById(nodeId);
    return node ? node.innerHTML : null;
  };
  
  const copyToClipboard = async (html: string) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }), // Fallback for plain text
        }),
      ]);
      console.log("Content copied as rich text!");
      toast.success("Article copied into the clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const [ai_check, setAiCheck] = useState<number | null>(null);
  const [ai_check_request, setAiCheckRequest] = useState(false);
  const checkAI = (content: string, shouldUpdateDB = false) => {
    setAiCheckRequest(true);
    fetch('/api/check-ai', {
      mode:'cors', 
      method: 'POST',
        body: JSON.stringify({
        'content' : content
      }),
      headers: {
       'Content-type': 'application/json; charset=UTF-8',
      }
    }).then(res => res.json())
      .then((json) => {
         console.log(json);  
         setAiCheck(json.aiScore);
         setAiCheckRequest(false);
         // update ai score
        //  if(shouldUpdateDB) {
        //   updateTodoMutation.mutate({
        //     id: todos[0]?.id,
        //     content,
        //     aiScore: json.res,
        //     type: 'article_upadte',
        //   });
        // }
      })
  }

  if(isLoading) return(
<Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh" maxW="100%" w="100%">
  <Flex w="100%" gap={4}>
    <Stack gap="4" w="70%">
      <Skeleton height="5" width="30%" />
      <Skeleton height="3" width="20%" />
      <Skeleton height="450" width="100%" />
    </Stack>
    <Stack gap="4" w="30%">
      <div className="h-[50px]"></div>
      <Skeleton height="450" width="100%" />
    </Stack>
  </Flex>
</Container>

  )
  
  if (error) return <Text>An error occurred: {error.message}</Text>;

  return (
    <Container alignItems="flex-start" minH="100vh" maxW="100%" w="100%" px="0">
      <VStack align="flex-start" spacing={4}>
        <div className="flex gap-x-4">
          <div>
           <Link href={`/dashboard`}>
            <Logo1/>
           </Link>
          </div>
          <div>
           <Heading size="md" fontWeight="500" fontSize="md" className="text-slate-500">
            <TbArrowBackUp style={{display: 'inline-block', cursor: 'pointer', verticalAlign: 'sub'}} className="mr-3 h-5 w-5" onClick={() => router.push('/articles')}/>
            {todos.map((article: any) => (
             <Link key={article.id} href={`/articles/${article.id}`}>
              {article.keyword}
             </Link>
            ))}
           </Heading>
           <Text className="text-slate-500 text-sm mt-[5px]">
            <Link href={`/articles?batchId=${todos[0].batchId}`}>{batch_name}</Link> / {todos[0].keyword} 
           </Text>
          </div>
        </div>

        <div className="rounded-md w-full">
            <div className="flex gap-x-4">
              <div className="flex-[2] relative">
               <div className="flex gap-x-4 absolute top-[12px] right-0">
                {isSaving ? (
                  <Spinner size="sm" color="#64748b" thickness="2px" />
                ) : (
                  <TbDeviceFloppy size={23} color="#64748b" className="cursor-pointer" 
                    onClick={() => handleUpdateTodo({
                     id: todos[0].id,
                     content: editorText,
                     aiScore: ai_check,
                     type: 'article_upadte'
                    })}
                  />
                )}
                <TbCopy className="cursor-pointer" size={23} color="#64748b" onClick={copyContent}/>
               </div>
               <ReactQuill id="my-quill-editor" theme="snow" value={editorText} style={{ height: "100%" }} onChange={setEditorText} readOnly={isSaving}/>
              </div>
              <div className="flex-[1]">
                <div className="flex justify-end items-center h-[52px]">
                 <Link 
                   href="/article-generator" 
                   className="flex items-center text-[#64748b] gap-1"
                 >
                  <TbArrowLeft size={20} />Generate New Article
                 </Link>
                </div>
                <div className="editor-right-col">
                  {/* <ScoreMeter 
                    score={wordCount} 
                    avgScore={65} 
                    topScore={95} 
                    aiCheckRequest={ai_check_request}
                    checkAI={() => checkAI(editorText, false)}
                    colorMode={colorMode}/> */}
                  <ScoreMeter 
                    score={wordCount}
                    colorMode={colorMode}/>

    <Box
      boxShadow="md"
      border="none"
      rounded="xl"
      p={6}
      shadow="md"
      className="w-full max-w-lg mx-auto mt-[30px]"
      bg={colorMode === 'dark' ? '#151922' : '#fff'}
    >
      <Flex direction="column" gap={4}>
        {/* Plagiarism Score */}
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <Icon as={MdCheckCircle} color="green.500" boxSize={6} />
            <Text fontWeight="medium" className="text-slate-500">Plagiarism Score</Text>
          </Flex>
          <Text className="text-slate-500" fontWeight="medium">0% Plagiarism</Text>
        </Flex>

        {/* Word Count */}
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <Icon as={MdSmartToy} color="blue.500" boxSize={6} />
            <Text fontWeight="medium" className="text-slate-500">AI Score        
              <Button 
               rounded="full" 
               variant="outline" 
               size="xs" 
               fontWeight="normal" 
               className='text-slate-500 ml-2'
               disabled={ai_check_request? true : false} 
               onClick={() => checkAI(editorText, false)}>
              { ai_check_request ? 'Checking...' : 'Check Score'}
              </Button>
            </Text>
          </Flex>
          <Text fontWeight="medium" className="text-slate-500">{ai_check ? ai_check + '%' : <Spinner size="xs" color={spinnerColor} mr="16px" /> }</Text>
        </Flex>

        {/* Readability Score */}
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <Icon as={MdAutoGraph} color="purple.500" boxSize={6} />
            <Text fontWeight="medium" className="text-slate-500">Readability Score</Text>
          </Flex>
          <Text fontWeight="medium" className="text-slate-500">{ ReadabilityScore ? ReadabilityScore : ''}/100</Text>
        </Flex>
      </Flex>
    </Box>
                </div>
              </div>
            </div>
        </div>
      </VStack>
    </Container>
  );
};

export default Keyword;
