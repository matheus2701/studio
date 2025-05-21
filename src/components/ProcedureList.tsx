
"use client";

import { useProcedures } from "@/contexts/ProceduresContext";
import type { Procedure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2 } from "lucide-react";
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

interface ProcedureListProps {
  onEditProcedure: (procedure: Procedure) => void;
}

export function ProcedureList({ onEditProcedure }: ProcedureListProps) {
  const { procedures, deleteProcedure } = useProcedures();
  const { toast } = useToast();

  const handleDelete = (procedureId: string, procedureName: string) => {
    deleteProcedure(procedureId);
    toast({
      title: "Procedimento Removido",
      description: `O procedimento "${procedureName}" foi removido com sucesso.`,
    });
  };

  if (procedures.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Nenhum procedimento cadastrado.</p>;
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[100px] text-right">Duração (min)</TableHead>
            <TableHead className="w-[100px] text-right">Preço (R$)</TableHead>
            <TableHead className="w-[120px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {procedures.map((procedure) => (
            <TableRow key={procedure.id}>
              <TableCell className="font-medium">{procedure.name}</TableCell>
              <TableCell className="text-right">{procedure.duration}</TableCell>
              <TableCell className="text-right">{procedure.price.toFixed(2)}</TableCell>
              <TableCell className="text-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEditProcedure(procedure)} className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o procedimento "{procedure.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(procedure.id, procedure.name)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
