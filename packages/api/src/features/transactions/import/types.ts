export interface PreviewTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface ParseResult {
  transactions: PreviewTransaction[];
  extractedBalance: number | null;
}

export type ImportFormat = 'OFX' | 'NUBANK_CSV' | 'INTER_CSV';
