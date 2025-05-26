
"use client";

import { useProcedures } from "@/contexts/ProceduresContext";
import type { Procedure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Edit, Trash2, Percent } from "lucide-react"; // Import Percent icon
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
        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
          <TableRow>
            <TableHead className="px-2 sm:px-4 py-3">Nome</TableHead>
            <TableHead className="text-right whitespace-nowrap px-2 sm:px-4 py-3">Duração (min)</TableHead>
            <TableHead className="text-right whitespace-nowrap px-2 sm:px-4 py-3">Preço (R$)</TableHead>
            <TableHead className="text-center px-2 sm:px-4 py-3">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {procedures.map((procedure) => (
            <TableRow key={procedure.id}>
              <TableCell className="font-medium px-2 sm:px-4 py-3">
                {procedure.name}
                {procedure.isPromo && procedure.promoPrice !== undefined && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    <Percent className="h-3 w-3 mr-1" /> PROMO
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right px-2 sm:px-4 py-3">{procedure.duration}</TableCell>
              <TableCell className="text-right px-2 sm:px-4 py-3">
                {procedure.isPromo && procedure.promoPrice !== undefined ? (
                  <div className="flex flex-col items-end">
                    <span className="text-destructive font-semibold">R$ {procedure.promoPrice.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground line-through">R$ {procedure.price.toFixed(2)}</span>
                  </div>
                ) : (
                  `R$ ${procedure.price.toFixed(2)}`
                )}
              </TableCell>
              <TableCell className="text-center px-2 sm:px-4 py-3">
                <div className="flex items-center justify-center space-x-1">
                  <Button variant="outline" size="icon" onClick={() => onEditProcedure(procedure)} className="h-7 w-7 sm:h-8 sm:w-8">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
