
"use client";

import { useCustomers } from "@/contexts/CustomersContext";
import type { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Info } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface CustomerListProps {
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerList({ onEditCustomer }: CustomerListProps) {
  const { customers, deleteCustomer } = useCustomers();
  const { toast } = useToast();

  const handleDelete = (customerId: string, customerName: string) => {
    deleteCustomer(customerId);
    toast({
      title: "Cliente Removido",
      description: `O cliente "${customerName}" foi removido com sucesso.`,
    });
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 px-4 border border-dashed rounded-lg">
        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
        <p className="text-sm text-muted-foreground">Clique em "Adicionar Cliente" para começar.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
          <TableRow>
            <TableHead className="px-2 sm:px-4 py-3">Nome</TableHead>
            <TableHead className="px-2 sm:px-4 py-3 hidden md:table-cell">Telefone</TableHead>
            <TableHead className="px-2 sm:px-4 py-3">Tags</TableHead>
            <TableHead className="text-center px-2 sm:px-4 py-3">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium px-2 sm:px-4 py-3">{customer.name}</TableCell>
              <TableCell className="px-2 sm:px-4 py-3 hidden md:table-cell">{customer.phone || 'N/A'}</TableCell>
              <TableCell className="px-2 sm:px-4 py-3">
                {customer.tags && customer.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.slice(0, 3).map(tag => ( // Mostra até 3 tags, pode ajustar
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {customer.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{customer.tags.length - 3}</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Nenhuma tag</span>
                )}
              </TableCell>
              <TableCell className="text-center px-2 sm:px-4 py-3">
                <div className="flex items-center justify-center space-x-1">
                  <Button variant="outline" size="icon" onClick={() => onEditCustomer(customer)} className="h-7 w-7 sm:h-8 sm:w-8">
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover o cliente "{customer.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(customer.id, customer.name)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
