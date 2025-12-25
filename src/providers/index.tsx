"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PrivacyProvider } from "@/contexts/privacy-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { SmoothScroll } from "./smooth-scroll";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <PrivacyProvider>
            <TooltipProvider>
              <SmoothScroll>
                {children}
              </SmoothScroll>
              <Toaster
                position="top-right"
                toastOptions={{
                  classNames: {
                    toast: "bg-background text-foreground border border-border shadow-xl rounded-xl p-4 gap-3",
                    
                    title: "text-foreground font-semibold text-sm",
                    
                    description: "!text-muted-foreground !opacity-100 text-sm font-medium",
                    
                    success: "[&_svg]:!text-finza-success", 
                    error: "[&_svg]:!text-destructive",
                    info: "[&_svg]:!text-blue-500",
                    warning: "[&_svg]:!text-amber-500",
                    
                    actionButton: "bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md font-medium",
                    cancelButton: "bg-muted text-muted-foreground text-xs px-3 py-2 rounded-md font-medium",
                  },
                }}
              />
            </TooltipProvider>
          </PrivacyProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}