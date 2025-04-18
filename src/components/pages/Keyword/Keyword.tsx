import React, { useState, useEffect } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  useColorMode
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
import { MdCheckCircle, MdOutlineTextSnippet, MdAutoGraph } from 'react-icons/md';
import { syllable } from 'syllable';

const Keyword = ({id}: {id: string}) => {

  const { colorMode, toggleColorMode } = useColorMode();
  //console.log(colorMode);
  useEffect(() => {
    if(colorMode === 'dark'){
      document.body.style.backgroundColor = '#1a202c';
    }else{
      document.body.style.backgroundColor = '#f5faff';
    }
  }, [colorMode])

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
      }>;
    }
  });

  const todos = React.useMemo(() => todosData?.todos || [], [todosData]);
  const [editorText, setEditorText] = React.useState('');
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
      setEditorText(todos[0]?.content);
      let count = getCount(todos[0]?.content);
      setWordCount(count);
      //console.log('readibility score: ' + checkReadabilityScore(todos[0]?.content));
      setReadabilityScore(checkReadabilityScore(todos[0]?.content));

      if(todos[0]?.aiScore){
        setAiCheck(todos[0]?.aiScore);
      }else{
        checkAI(todos[0]?.content, true);
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

  const handleUpdateTodo = async (
    todo: {id: string, content: string, aiScore?: number | null, type: string}
  ) => {
    return await updateTodoMutation.mutateAsync(todo);
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
            <Link href={`/articles?batch=${todos[0].batch}`}>{todos[0].batch}</Link> / {todos[0].keyword} 
           </Text>
          </div>
        </div>

        <div className="rounded-md w-full">
            <div className="flex gap-x-4">
              <div className="flex-[2] relative">
               <div className="flex gap-x-4 absolute top-[12px] right-0">
                <TbDeviceFloppy size={23} color="#64748b" className="cursor-pointer" 
                  onClick={() => handleUpdateTodo({
                   id: todos[0].id,
                   content: editorText,
                   aiScore: ai_check,
                   type: 'article_upadte'
                  })}
                />
                <TbCopy className="cursor-pointer" size={23} color="#64748b" onClick={copyContent}/>
               </div>
               <ReactQuill id="my-quill-editor" theme="snow" value={editorText} style={{ height: "100%" }} onChange={setEditorText}/>
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
                <div className="editor-right-col" style={{ backgroundColor: colorMode === 'light' ? '#fff' : '#12171f' }}>
                 <Box>
                  <ScoreMeter 
                    score={ai_check} 
                    avgScore={30} 
                    topScore={5} 
                    aiCheckRequest={ai_check_request}
                    checkAI={() => checkAI(editorText, false)}/>
                 </Box> 
    <Box
      boxShadow="md"
      border="none"
      rounded="xl"
      p={6}
      shadow="md"
      className="w-full max-w-lg mx-auto mt-[30px]"
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
            <Icon as={MdOutlineTextSnippet} color="blue.500" boxSize={6} />
            <Text fontWeight="medium" className="text-slate-500">Word Count</Text>
          </Flex>
          <Text fontWeight="medium" className="text-slate-500">{wordCount} words</Text>
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
