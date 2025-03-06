
import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Edit, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import supabase from "@/config/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Client {
  id: string;
  client_name: string;
  display_name: string;
  email: string;
  phone_number: string;
  status: string;
  total_projects: number;
  active_employees: number;
  city: string;
}

interface Props {
  data: Client[];
}

const ClientTable: React.FC<Props> = ({ data }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = { id: 'user123', organization_id: 'org123' }; // Default mock user data

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "client_name",
      header: "Client Name",
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone_number",
      header: "Phone Number",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        // Map string values to valid variant types
        let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "secondary";
        if (status === "active") {
          badgeVariant = "default"; // using "default" instead of "green"
        } else if (status === "inactive") {
          badgeVariant = "destructive"; // using "destructive" instead of "red"
        }
        return <Badge variant={badgeVariant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "total_projects",
      header: "Total Projects",
    },
    {
      accessorKey: "active_employees",
      header: "Active Employees",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
        const [open, setOpen] = React.useState(false);

        const handleStatusChange = async (newStatus: string) => {
          try {
            const { error } = await supabase
              .from("hr_clients")
              .update({
                status: newStatus,
                organization_id: user.organization_id,
                created_by: user.id, // Add missing required field
                updated_by: user.id
              })
              .eq("id", client.id);

            if (error) throw error;
            
            toast.success("Client status updated successfully");
            invalidateQueries();
          } catch (error) {
            console.error("Error updating client status:", error);
            toast.error("Failed to update client status");
          }
        };

        const handleDelete = async () => {
          try {
            const { error } = await supabase
              .from("hr_clients")
              .delete()
              .eq("id", client.id);

            if (error) throw error;

            toast.success("Client deleted successfully");
            invalidateQueries();
          } catch (error) {
            console.error("Error deleting client:", error);
            toast.error("Failed to delete client");
          } finally {
            setOpen(false);
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/clients/edit/${client.id}`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                <Copy className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusChange(client.status === "active" ? "inactive" : "active")}
              >
                {client.status === "active" ? "Mark Inactive" : "Mark Active"}
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the client and
                      remove all of its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const handleExportPdf = () => {
    const doc = new jsPDF();

    // Define the columns for the table
    const tableColumns = ["Client Name", "Display Name", "Email", "Phone Number", "City", "Status", "Total Projects", "Active Employees"];

    // Prepare the data for the table
    const tableData = data.map(client => [
      client.client_name,
      client.display_name,
      client.email,
      client.phone_number,
      client.city,
      client.status,
      client.total_projects.toString(),
      client.active_employees.toString()
    ]);

    // Add the table to the PDF
    doc.autoTable({
      head: [tableColumns],
      body: tableData,
    });

    // Save the PDF
    doc.save("client_data.pdf");
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="mb-2 md:mb-0">
          <Label htmlFor="search" className="mr-2">
            Search:
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button onClick={handleExportPdf}>Export to PDF</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} onClick={() => header.column.toggleSorting(header.id)}
                      className='cursor-pointer'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      {{
                        /* {header.column.getCanSort() ? (
                            <ArrowDownUp className="ml-2 h-4 w-4" />
                          ) : null} */
                      }}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows
                .filter((row) => {
                  const values = Object.values(row.original).join(" ").toLowerCase();
                  return values.includes(search.toLowerCase());
                })
                .map((row) => {
                  return (
                    <TableRow key={row.id} data-row={JSON.stringify(row.original)}>
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientTable;
