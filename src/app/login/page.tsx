
"use client";

import { useState } from "react";
import { LoginForm } from "@/components/forms/LoginForm";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm"; // Novo formulário
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole size={32} />
          </div>
          <CardTitle>{showForgotPassword ? "Recuperar Senha" : "Acesso Restrito"}</CardTitle>
          <CardDescription>
            {showForgotPassword
              ? "Insira o código de recuperação e sua nova senha."
              : "Por favor, insira suas credenciais para continuar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
          ) : (
            <>
              <LoginForm />
              <Button
                variant="link"
                className="mt-4 w-full px-0 text-sm text-muted-foreground hover:text-primary"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
