import React, { useState, useEffect } from "react";
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
import { Articles } from "@prisma/client";
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
import { useSearchParams, useRouter } from "next/navigation";

const ArticlesList: React.FC = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const batch_param = searchParams.get("batch"); 
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (batch_param) {
      setEnabled(true);
    }
  }, [batch_param]);

  const {
    data: todosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos", batch_param],
    queryFn: async () => {
      const url = batch_param ? `/api/article-generator?batch=${batch_param}` : "/api/article-generator";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json() as Promise<{
        todos: (Omit<Articles, "updatedAt"> & { updatedAt: string })[];
      }>;
    },
    enabled: true,
  });

  const updateTodoMutation = useMutation({
    mutationFn: async (updatedTodo: {
      id: string;
      text?: string;
      isCompleted?: boolean;
    }) => {
      const response = await fetch("/api/article-generator", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTodo),
      });
      if (!response.ok) {
        throw new Error("Failed to update todo");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Todo updated successfully");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      toast.error("Error updating todo");
    },
  });

  const handleUpdateTodo = async (
    todo: Pick<Articles, "id" | "content">
  ) => {
    return await updateTodoMutation.mutateAsync(todo);
  };

  const todos = todosData?.todos || [];

  const columnHelper = createColumnHelper<{
    id: string;
    keyword: string;
    updatedAt: string;
  }>();

  const columns = [
    columnHelper.accessor("keyword", {
      cell: ({ row }) => (
        <Text
          size="sm"
          border="none"
        ><a href={`/articles/${row.original.id}`}>{row.original.keyword}</a></Text>
      ),
      header: "Keyword",
    }),
    {
      accessorKey: "updatedAt",
      header: ({ column }: { column: Column<any> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            size="sm"
          >
            Last update
            {column.getIsSorted() === "desc" && (
              <TbArrowDown className="ml-2 h-4 w-4" />
            )}
            {column.getIsSorted() === "asc" && (
              <TbArrowUp className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }: { row: Row<Articles> }) => (
        <div className="lowercase">
          {new Date(row.getValue("updatedAt")).toLocaleString()}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: Row<Articles> }) => {
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
              <DropdownMenuItem onClick={() => router.push(`/articles/${row.original.id}`)}>
                <TbEye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/articles/${row.original.id}`)}>
                <TbPencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteDialog(row.original)}>
                <TbTrash className="mr-2 h-4 w-4" />
                Delete
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
      Omit<Articles, "updatedAt"> & { updatedAt: string }
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
  const [todoToDelete, setTodoToDelete] = React.useState<Articles | null>(null);

  const openDeleteDialog = (todo: Articles) => {
    setTodoToDelete(todo);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setTodoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [todoToEdit, setTodoToEdit] = React.useState<Articles | null>(null);

  const closeEditDialog = () => {
    setTodoToEdit(null);
    setIsEditDialogOpen(false);
  };

 // if (isLoading) return <Text>Loading articles...</Text>;
  if (error) return <Text>An error occurred: {error.message}</Text>;

  return (
    <Container pt={["16px", "40px"]} alignItems="flex-start" minH="100vh">
      <VStack align="flex-start" spacing={4}>
        <Heading size="md">{batch_param ? batch_param : 'Articles generated' }</Heading>
        <Text className="text-slate-500 text-sm">
         {batch_param ? 
          'Here is a list of articles generated for this batch'
            : 
          'Here is a list of articles generated from the tool.'
         } 
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

export default ArticlesList;

const DeleteTodoDialog = ({
  todo,
  isOpen,
  onClose,
}: {
  todo: Articles | undefined;
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
    onSuccess: (_, deletedTodoId) => {
      toast.success("Article deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
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
  onUpdate: (todo: Pick<Articles, "id" | "batch" | "content" >) => Promise<void>;
  todo: Articles | undefined;
}) => {
  const [text, setText] = useState(todo?.batch || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription>
            Update your item, mark as complete.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="text" className="w-24 text-right">
              Todo
            </Label>
            <div className="flex-1">
              <Input
                id="text"
                defaultValue={todo?.batch}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="is-completed" className="w-24 text-right">
              Done
            </Label>

          </div>
        </div>
        <DialogFooter>
          {/* <Button
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
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
