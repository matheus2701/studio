
"use client";

import { NotificationPreferencesForm } from "@/components/forms/NotificationPreferencesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>
            Escolha como você gostaria de ser notificado sobre seus agendamentos e promoções.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}
