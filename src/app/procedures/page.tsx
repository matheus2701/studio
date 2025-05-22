
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ProcedureForm } from "@/components/forms/ProcedureForm";
import { ProcedureList } from "@/components/ProcedureList";
import type { Procedure } from '@/lib/types';
import { PlusCircle, Settings2 } from 'lucide-react';

export default function ProceduresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  const handleAddProcedure = () => {
    setEditingProcedure(null);
    setIsDialogOpen(true);
  };

  const handleEditProcedure = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProcedure(null);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Gerenciar Procedimentos
            </CardTitle>
            <CardDescription>Adicione, edite ou remova os procedimentos oferecidos.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddProcedure} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingProcedure ? "Editar Procedimento" : "Adicionar Novo Procedimento"}</DialogTitle>
                <DialogDescription>
                  {editingProcedure ? "Atualize os detalhes do procedimento." : "Preencha os detalhes do novo procedimento."}
                </DialogDescription>
              </DialogHeader>
              <ProcedureForm 
                procedureToEdit={editingProcedure} 
                onFormSubmit={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ProcedureList onEditProcedure={handleEditProcedure} />
        </CardContent>
      </Card>
    </div>
  );
}
