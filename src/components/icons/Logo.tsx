
import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Sparkles className="h-7 w-7" />
      <span className="text-xl font-semibold tracking-tight">Agende Valery Studio</span>
    </div>
  );
}
