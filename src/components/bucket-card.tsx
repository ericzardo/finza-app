"use client";

import { PiggyBank, Settings2 } from "lucide-react";
import { Bucket } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";  

interface BucketCardProps {
  bucket: Bucket;
  currency: string;
  index: number;
  onEdit: (bucket: Bucket) => void;
}

export function BucketCard({ bucket, currency, index, onEdit }: BucketCardProps) {
  const colors = [
    "bg-purple-100 text-purple-600",
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
  ];
  const colorClass = colors[index % colors.length];

  return (
    <Card
     className={cn(
        "border-border/60 finza-card-hover animate-fade-up group relative overflow-hidden transition-all hover:shadow-md",
        bucket.is_default && "ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
            <PiggyBank className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            {bucket.is_default && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium"
              >
                Padrão
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => onEdit(bucket)}
            >
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="font-semibold text-lg leading-none tracking-tight">
            {bucket.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {bucket.allocation_percentage}% alocado
          </p>
        </div>

        <div className="space-y-2">
          <Progress 
            value={bucket.allocation_percentage} 
            className="h-2" 
          />
          
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(Number(bucket.current_balance), currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}