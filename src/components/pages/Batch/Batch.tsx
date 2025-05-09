import React, { useState, useEffect, useRef } from "react";
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
  TbArrowBack,
  TbArrowDown,
  TbArrowUp,
  TbDots,
  TbPencil,
  TbEye,
  TbTrash,
} from "react-icons/tb";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { GodmodeArticles } from "@prisma/client";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from "@/app/providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const Batch: React.FC = () => {
  const router = useRouter();

  const {
    data: todosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["batch"],
    queryFn: async () => {
      const response = await fetch("/api/article-generator/batch");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    enabled: true,
  });

  const updateTodoMutation = useMutation({
    mutationFn: async (updatedTodo: {
      id: string;
      content: string;
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
    onSuccess: () => {
      toast.success("Article updated successfully");
      queryClient.invalidateQueries({ queryKey: ["batch"] });
    },
    onError: () => {
      toast.error("Error updating article");
    },
  });

  const handleUpdateTodo = async (
    todo: Pick<GodmodeArticles, "id" | "content">
  ) => {
    return await updateTodoMutation.mutateAsync({
      id: todo.id,
      content: todo.content ?? "",
    });
  };

  const todos = todosData?.todos || [];

  console.log(todosData);

  type ArticlesWithMaxCreatedAt = {
    id: string;
    batchId: string;
    batch: string;
    _max: {
      createdAt: Date;
    };
    _count: {
        batchId: number;
      };
    updatedAt: string;
  };
  
  const columnHelper = createColumnHelper<ArticlesWithMaxCreatedAt>();
  const columns = [
    columnHelper.accessor("batchId", {
      cell: ({ row }) => (
        <Text size="sm" border="none">
          <a href={`/articles?batchId=${row.original.batchId}`}>{row.original.batch}</a>
        </Text>
      ),
      header: "Batch",
    }),
    {
      id: "count",
      header: "Articles",
      cell: ({ row }: { row: Row<ArticlesWithMaxCreatedAt> }) => (
        <div>{row.original._count.batchId}</div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }: { column: Column<any> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            size="sm"
          >
            Created At
            {column.getIsSorted() === "desc" && (
              <TbArrowDown className="ml-2 h-4 w-4" />
            )}
            {column.getIsSorted() === "asc" && (
              <TbArrowUp className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }: { row: Row<ArticlesWithMaxCreatedAt> }) => (
        <div className="lowercase">
          {new Date(row.original._max.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: Row<ArticlesWithMaxCreatedAt> }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <TbDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/articles?batch=${row.original.batch}`)}>
                <TbEye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: todos,
    columns: columns as ColumnDef<
      Omit<GodmodeArticles, "updatedAt"> & { updatedAt: string }
    >[],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableSortingRemoval: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [todoToDelete, setTodoToDelete] = React.useState<GodmodeArticles | null>(null);

  const openDeleteDialog = (todo: GodmodeArticles) => {
    setTodoToDelete(todo);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setTodoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [todoToEdit, setTodoToEdit] = React.useState<GodmodeArticles | null>(null);

  const openEditDialog = (todo: GodmodeArticles) => {
    setTodoToEdit(todo);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setTodoToEdit(null);
    setIsEditDialogOpen(false);
  };

 // if (isLoading) return <Text>Loading articles...</Text>;
  if (error) return <Text>An error occurred: {error.message}</Text>;

  return (
    <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
      <VStack align="flex-start" spacing={4}>
        <Heading size="md">Articles generated</Heading>
        <Text className="text-slate-500 text-sm">
          Here is a list of articles generated from the tool.
        </Text>
        <Button 
           colorScheme="brand" 
           onClick={() => router.push('/article-generator')}>
          Generate New articles
        </Button>
        <div className="rounded-md border  w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? 'Loading...' : 'No results.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </VStack>
      <DeleteTodoDialog
        todo={todoToDelete || undefined}
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
      />
      {isEditDialogOpen && (
        <EditTodoDialog
          todo={todoToEdit || undefined}
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          onUpdate={handleUpdateTodo}
          isLoading={updateTodoMutation.isPending}
        />
      )}
    </Container>
  );
};

export default Batch;

const DeleteTodoDialog = ({
  todo,
  isOpen,
  onClose,
}: {
  todo: GodmodeArticles | undefined;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId: string) => {
      const response = await fetch("/api/article-generator", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: todoId }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete article");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Article deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["batch"] });
    },
    onError: () => {
      toast.error("Error deleting article");
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            <br />
            This will permanently delete the article <strong>{todo?.keyword}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteTodoMutation.mutate(todo?.id || "")}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const EditTodoDialog = ({
  isLoading,
  isOpen,
  onClose,
  onUpdate,
  todo,
}: {
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todo: Pick<GodmodeArticles, "id" | "content">) => Promise<void>;
  todo: GodmodeArticles | undefined;
}) => {
  const [content, setContent] = useState(todo?.content || "");

  useEffect(() => {
    setContent(todo?.content || "");
  }, [todo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
          <DialogDescription>
            Update the article content below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="content" className="w-24 text-right">
              Content
            </Label>
            <div className="flex-1">
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            isLoading={isLoading}
            colorScheme="brand"
            onClick={async () => {
              await onUpdate({
                id: todo?.id || "",
                content,
              });
              onClose();
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
