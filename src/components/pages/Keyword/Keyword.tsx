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

const Keyword: React.FC = ({id}: {id: string}) => {
  
  const router = useRouter();
  const {
    data: todosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos"],
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
    todo: Pick<Articles, "id" | "content">
  ) => {
    return await updateTodoMutation.mutateAsync(todo);
  };

  if (isLoading) return <Text>Loading article...</Text>;
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
              <ReactQuill theme="snow" value={editorText} style={{ height: "400px" }} onChange={setEditorText}/>
            </div>
        </div>
        <br/>
        <div style={{display: 'flex', gap: '15px'}}>
          <Button colorScheme="brand" onClick={() => handleUpdateTodo({
            id: todos[0].id,
            content: editorText,
          })}>Update</Button>
          <Button>Copy</Button>
        </div>
      </VStack>
    </Container>
  );
};

export default Keyword;
