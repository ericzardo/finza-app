import { parse } from 'csv-parse/sync';
import type { PreviewTransaction } from './types';

// Nubank exporta CSVs com headers variados:
// EN: "Date","Title","Amount"  (conta corrente)
// PT-BR: "Data","Título","Valor" (menos comum)
// EN fatura: "date","title","amount" (fatura CC, tudo lowercase)

const HEADER_MAP: Record<string, string> = {
  date: 'date',
  data: 'date',
  title: 'description',
  título: 'description',
  titulo: 'description',
  description: 'description',
  descrição: 'description',
  descricao: 'description',
  amount: 'amount',
  valor: 'amount',
};

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const key = h
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, '');
    return HEADER_MAP[key] ?? key;
  });
}

export function parseNubankCsv(content: string): PreviewTransaction[] {
  const records = parse(content, {
    columns: (headers: string[]) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  return records
    .filter((row) => row.date && row.amount)
    .map((row) => {
      const rawAmount = Number.parseFloat(row.amount.replace(',', '.'));
      const amount = Math.abs(rawAmount);
      const type: 'INCOME' | 'EXPENSE' = rawAmount >= 0 ? 'INCOME' : 'EXPENSE';
      const description = (row.description || 'Sem descrição').trim();

      // Nubank uses YYYY-MM-DD
      const date = new Date(`${row.date}T12:00:00.000Z`).toISOString();

      return { date, amount, description, type };
    });
}
