"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UploadCloud, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn, getCurrencySymbol } from "@/lib/utils";

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

interface ImportTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currency?: string;
  onSuccess?: () => void;
}

export function ImportTransactionDialog({
  open,
  onOpenChange,
  workspaceId,
  currency = "BRL",
  onSuccess,
}: ImportTransactionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const [calculatedOpeningBalance, setCalculatedOpeningBalance] = useState<number | null>(null);

  const currencySymbol = getCurrencySymbol(currency);

  // Função para validar se uma string é uma data no formato dd/mm/aaaa
  const isValidDate = (dateStr: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;

    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // Função para converter string de data dd/mm/aaaa para Date
  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  // Função para converter valor brasileiro para float
  const parseBrazilianCurrency = (value: string): number => {
    if (!value) return 0;

    // Remove espaços e caracteres especiais, exceto vírgula, ponto e sinal de menos
    let cleaned = value.trim().replace(/[^\d,.-]/g, "");

    // Se tem vírgula e ponto, remove o ponto (separador de milhar)
    if (cleaned.includes(",") && cleaned.includes(".")) {
      cleaned = cleaned.replace(".", "");
    }

    // Substitui vírgula por ponto (decimal)
    cleaned = cleaned.replace(",", ".");

    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : Math.round(number * 100) / 100;
  };

  // Função para processar o arquivo CSV
    const processCSV = useCallback((file: File) => {
        setIsLoading(true);
        setFileName(file.name);
        setCalculatedOpeningBalance(null);

        Papa.parse(file, {
          encoding: "ISO-8859-1",
          complete: (results) => {
            try {
              const rows = results.data as string[][];

              // 1. TENTATIVA A: SALDO NO CABEÇALHO
              let headerBalance: number | null = null;
              for(let i = 0; i < 10 && i < rows.length; i++) {
                const colA = rows[i][0]?.trim();
                if (colA && (colA === "Saldo" || colA.includes("Saldo"))) {
                    const valB = rows[i][1]; 
                    if (valB) {
                      headerBalance = parseBrazilianCurrency(valB);
                      break; 
                    }
                }
              }

              // 2. ENCONTRAR INICIO DAS TRANSAÇÕES
              const startIndex = rows.findIndex(
                (row) => row[0] && isValidDate(row[0].trim())
              );

              if (startIndex === -1) {
                toast.error("Nenhuma data válida encontrada. Verifique se é um CSV bancário.");
                setIsLoading(false);
                return;
              }

              const transactions: ParsedTransaction[] = [];
              let totalTransactionsSum = 0;
              let firstRowBalance: number | null = null; 

              // Detectar índices das colunas
              let valorIndex = -1;
              let descIndex = -1;
              let saldoColIndex = -1;

              // Tenta achar pelo cabeçalho (linha anterior ao dados)
              if (startIndex > 0) {
                const headerRow = rows[startIndex - 1];
                for (let j = 0; j < headerRow.length; j++) {
                    const cell = headerRow[j]?.trim().toLowerCase();
                    if (cell === "valor" || cell === "amount") valorIndex = j;
                    if (cell === "descrição" || cell === "description") descIndex = j;
                    if (cell === "saldo" || cell === "balance") saldoColIndex = j;
                }
              }

              // Fallbacks se não achou pelo nome
              // Nubank padrão: Data(0), Valor(1), Identificador(2), Descrição(3)
              if (valorIndex === -1) valorIndex = 1; 
              
              for (let i = startIndex; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length < 2) continue;

                const dateStr = row[0]?.trim();
                if (!dateStr || !isValidDate(dateStr)) continue;

                const date = parseDate(dateStr);
                
                // Descrição: Se achou coluna explicita usa ela, senão tenta concatenar inteligentes
                let description = "Sem descrição";
                if (descIndex !== -1 && row[descIndex]) {
                    description = row[descIndex].trim();
                } else {
                    // Lógica de fallback: pega tudo que não é data, valor ou saldo
                    const parts = [];
                    for (let j = 1; j < row.length; j++) {
                        if (j !== valorIndex && j !== saldoColIndex && row[j]) {
                            // Ignora UUIDs/Identificadores do Nubank (ex: 692ef44a...)
                            // Se for muito longo e sem espaço, provavelmente é ID
                            if (row[j].length > 20 && !row[j].includes(" ")) continue;
                            parts.push(row[j].trim());
                        }
                    }
                    if (parts.length > 0) description = parts.join(" - ");
                }

                const valueStr = row[valorIndex]?.trim();
                if (!valueStr) continue;
                const amount = parseBrazilianCurrency(valueStr);
                
                totalTransactionsSum += amount;
                const type: "INCOME" | "EXPENSE" = amount < 0 ? "EXPENSE" : "INCOME";

                // Tenta pegar saldo da linha se existir coluna
                if (saldoColIndex !== -1 && firstRowBalance === null && row[saldoColIndex]) {
                    firstRowBalance = parseBrazilianCurrency(row[saldoColIndex]);
                }

                transactions.push({ date, description, amount, type });
              }

              if (transactions.length === 0) {
                toast.error("Nenhuma transação válida encontrada.");
                setIsLoading(false);
                return;
              }

              // 3. RECONCILIAÇÃO
              const finalBalanceReference = headerBalance !== null ? headerBalance : firstRowBalance;

              if (finalBalanceReference !== null) {
                const diff = finalBalanceReference - totalTransactionsSum;
                const roundedDiff = Math.round(diff * 100) / 100;
                if (Math.abs(roundedDiff) > 0.01) {
                  setCalculatedOpeningBalance(roundedDiff);
                }
              }

              setParsedData(transactions);
              toast.success(`${transactions.length} transações lidas!`);
            } catch (error) {
              console.error("Erro processamento:", error);
              toast.error("Erro ao ler o arquivo CSV.");
            } finally {
              setIsLoading(false);
            }
          },
          error: () => {
            toast.error("Erro crítico ao abrir o arquivo.");
            setIsLoading(false);
          },
        });
    }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        processCSV(file);
      }
    },
    [processCSV]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isLoading || parsedData.length > 0,
  });

  const handleConfirmImport = async () => {
  if (parsedData.length === 0) return;

  setIsImporting(true);
  try {
    const transactionsToSend = parsedData.map(transaction => ({
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      type: transaction.type,
    }));

    // LÓGICA DE INJEÇÃO AUTOMÁTICA
    if (calculatedOpeningBalance) {
       const type = calculatedOpeningBalance >= 0 ? "INCOME" : "EXPENSE";
       
       // Pega a data mais antiga do CSV para criar o saldo inicial antes dela
       // (Assumindo que a última linha é a mais antiga, padrão bancário)
       const oldestDate = parsedData[parsedData.length - 1]?.date || new Date();
       
       // Retira 1 minuto para garantir cronologia
       const openingDate = new Date(oldestDate);
       openingDate.setMinutes(openingDate.getMinutes() - 1);

       // Adiciona no INÍCIO do array
       transactionsToSend.push({
         date: openingDate,
         description: "Saldo Inicial (Ajuste de Importação)",
         amount: Math.abs(calculatedOpeningBalance),
         type: type as "INCOME" | "EXPENSE"
       });
    }

    const response = await fetch('/api/transactions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, transactions: transactionsToSend }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    toast.success(`${data.data.count} transações importadas!`);
    handleOpenChange(false);
    handleReset();
    router.refresh();
    if (onSuccess) onSuccess();
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Erro ao importar');
  } finally {
    setIsImporting(false); // Mantive seu loading state
  }
};

  const handleReset = () => {
    setParsedData([]);
    setFileName("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);

    return value < 0 ? `-${currencySymbol} ${formatted}` : `${currencySymbol} ${formatted}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2/4 p-6 border-none shadow-2xl gap-0 flex flex-col">
        <DialogHeader className="pb-4 mb-4">
          <DialogTitle className="text-xl">Importar Transações</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV do extrato bancário para importar suas
            transações automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {parsedData.length === 0 ? (
            <>
              <div className="rounded-lg border border-border/40 p-4 mb-4 bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium mb-2">Exemplo do formato esperado:</div>
                <div className="text-sm">
                  {/* MUDANÇA AQUI: grid-cols-4 para caber o saldo */}
                  <div className="grid grid-cols-4 gap-2 text-xs bg-background p-2 rounded border border-border/30">
                    <div className="font-medium text-muted-foreground border-b border-border/30 pb-1">Data</div>
                    <div className="font-medium text-muted-foreground border-b border-border/30 pb-1">Descrição</div>
                    <div className="font-medium text-muted-foreground border-b border-border/30 pb-1 text-right">Valor</div>
                    {/* Coluna Nova */}
                    <div className="font-medium text-muted-foreground border-b border-border/30 pb-1 text-right">
                      Saldo <span className="text-[10px] opacity-70 font-normal">(Opcional)</span>
                    </div>

                    {/* Linha 1 */}
                    <div className="text-foreground/70">01/01/2024</div>
                    <div className="text-foreground/70">Exemplo de Despesa</div>
                    <div className="text-right text-foreground/70">R$ 100,00</div>
                    <div className="text-right text-muted-foreground">R$ 1.900,00</div>

                    {/* Linha 2 */}
                    <div className="text-foreground/70">15/01/2024</div>
                    <div className="text-foreground/70">Salário Recebido</div>
                    <div className="text-right text-finza-success">R$ 5.000,00</div>
                    <div className="text-right text-muted-foreground">R$ 6.900,00</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">* A primeira coluna deve conter datas no formato dd/mm/aaaa</p>
                </div>
              </div>
              
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed border-finza-navy/40 rounded-lg p-8 text-center cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  isDragActive && "border-primary bg-accent",
                  (isLoading || parsedData.length > 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>

                  {isLoading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-medium">Processando arquivo...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aguarde enquanto lemos os dados
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">
                          {isDragActive
                            ? "Solte o arquivo aqui"
                            : "Arraste um arquivo CSV ou clique para selecionar"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Apenas arquivos .csv são aceitos
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsedData.length} transações encontradas
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg border border-border">
                <ScrollArea className="h-100" data-lenis-prevent="true">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-30">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right w-37.5">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-sm">
                            {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.description}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium text-sm",
                              transaction.amount < 0
                                ? "text-destructive"
                                : "text-finza-success"
                            )}
                          >
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>

          {parsedData.length > 0 && (
            <Button
              onClick={handleConfirmImport}
              disabled={isLoading || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Importação
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
