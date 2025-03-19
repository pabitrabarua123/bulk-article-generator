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
} from "@chakra-ui/react";
import {
  TbArrowBackUp
} from "react-icons/tb";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Articles } from "@prisma/client";
import { queryClient } from "@/app/providers";
import { useRouter } from "next/navigation";
import { HStack, Stack, Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react"

const Keyword = ({id}: {id: string}) => {
  
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
        todos: (Omit<Articles, "updatedAt"> & { updatedAt: string })[];
      }>;
    }
  });

  const todos = React.useMemo(() => todosData?.todos || [], [todosData]);
  const [editorText, setEditorText] = React.useState('');

  useEffect(() => {
    setEditorText(todos[0]?.content);
  }, [todos])

  const updateTodoMutation = useMutation({
    mutationFn: async (updatedTodo: {
      id: string;
      content?: string;
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
    todo: {id: string, content: string, type: string}
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

  if(isLoading) return(
   <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
    <Stack gap="4">
      <Skeleton height="5" width="50%"/>
      <Skeleton height="3" width="20%"/>
      <Skeleton height="350" width="100%"/>
      <Skeleton height="6" width="100px"/>
    </Stack>
   </Container>
  )
  
  if (error) return <Text>An error occurred: {error.message}</Text>;

  return (
    <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
      <VStack align="flex-start" spacing={4}>
        <Heading size="md">
        <TbArrowBackUp style={{display: 'inline-block', cursor: 'pointer'}} className="mr-3 h-5 w-5" onClick={() => router.push('/articles')}/>
         {todos.map((article: any) => (
            <b key={article.id}>{article.keyword}</b>
          ))}
        </Heading>
        <Text className="text-slate-500 text-sm">
          <b>{todos[0].batch}</b> / {todos[0].keyword} 
        </Text>
        <div className="rounded-md w-full">
            <div>
              <ReactQuill id="my-quill-editor" theme="snow" value={editorText} style={{ height: "400px" }} onChange={setEditorText}/>
            </div>
        </div>
        <br/>
        <div style={{display: 'flex', gap: '15px'}}>
          <Button colorScheme="brand" onClick={() => handleUpdateTodo({
            id: todos[0].id,
            content: editorText,
            type: 'article_upadte'
          })}>Update</Button>
          <Button onClick={copyContent}>Copy</Button>
        </div>
      </VStack>
    </Container>
  );
};

export default Keyword;
