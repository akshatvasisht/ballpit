'use client';

import { Toaster as SonnerToaster } from 'sonner';
import 'sonner/dist/styles.css';

export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      richColors
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'bg-card text-card-foreground border-2 border-border shadow-lg rounded-xl font-bold px-4 py-3 data-[type=success]:bg-green data-[type=error]:bg-pink data-[type=warning]:bg-yellow data-[type=info]:bg-cyan data-[type=success]:text-background data-[type=error]:text-background data-[type=warning]:text-background data-[type=info]:text-background',
          title: 'font-black uppercase tracking-tight text-sm',
          description: 'text-xs text-card-foreground/80 font-medium',
          actionButton:
            'bg-foreground text-card rounded-lg border-2 border-border shadow-sm hover:-translate-y-0.5 transition-transform px-3 py-1 text-xs font-bold uppercase tracking-tight hover:shadow-md',
          cancelButton:
            'bg-yellow text-foreground rounded-lg border-2 border-foreground shadow-sm hover:-translate-y-0.5 transition-transform px-3 py-1 text-xs font-bold uppercase tracking-tight hover:shadow-md',
          closeButton:
            'text-foreground font-bold hover:bg-accent hover:text-accent-foreground rounded transition-colors',
        },
      }}
    />
  );
}
