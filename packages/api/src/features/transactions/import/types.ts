export interface PreviewTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
}

export type ImportFormat = 'OFX' | 'NUBANK_CSV' | 'INTER_CSV';
