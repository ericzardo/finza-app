"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/contexts/privacy-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PrivacyToggleProps {
  showTooltip?: boolean;
  className?: string;
}

export function PrivacyToggle({ showTooltip = true, className }: PrivacyToggleProps) {
  const { isPrivacyEnabled, togglePrivacy } = usePrivacy();

  const isValuesHidden = isPrivacyEnabled;

  const button = (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePrivacy}
      className={cn("hover:bg-secondary cursor-pointer", className)}
      title={isValuesHidden ? "Mostrar valores" : "Ocultar valores"}
    >
      {isValuesHidden ? (
        <EyeOff className="h-5 w-5 text-muted-foreground" />
      ) : (
        <Eye className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>{isValuesHidden ? "Mostrar valores" : "Ocultar valores"}</p>
      </TooltipContent>
    </Tooltip>
  );
}