
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { CustomerList } from "@/components/CustomerList";
import type { Customer } from '@/lib/types';
import { PlusCircle, Users } from 'lucide-react';

export default function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gerenciar Clientes
            </CardTitle>
            <CardDescription>Adicione, edite ou visualize seus clientes e suas tags.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddCustomer} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
                <DialogDescription>
                  {editingCustomer ? "Atualize os detalhes do cliente." : "Preencha os detalhes do novo cliente."}
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                customerToEdit={editingCustomer}
                onFormSubmit={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <CustomerList onEditCustomer={handleEditCustomer} />
        </CardContent>
      </Card>
    </div>
  );
}
