import { parse } from 'csv-parse/sync';
import type { PreviewTransaction } from './types';

// Banco Inter exporta CSV com delimitador ";" e headers como:
// "Data Lançamento";"Descrição";"Valor";"Saldo"
// Datas no formato dd/mm/yyyy
// Valores com vírgula decimal (ex: "1.234,56" ou "-50,00")

const HEADER_MAP: Record<string, string> = {
  'data lançamento': 'date',
  'data lancamento': 'date',
  data: 'date',
  descrição: 'description',
  descricao: 'description',
  historico: 'description',
  histórico: 'description',
  valor: 'amount',
  saldo: '_saldo',
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

function parseInterDate(raw: string): string {
  // dd/mm/yyyy → YYYY-MM-DD
  const parts = raw.trim().split('/');
  if (parts.length !== 3) {
    throw new Error(`Data inválida no CSV Inter: "${raw}"`);
  }
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}T12:00:00.000Z`).toISOString();
}

function parseInterAmount(raw: string): number {
  // "1.234,56" → 1234.56 | "-50,00" → -50.00
  return Number.parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

export function parseInterCsv(content: string): PreviewTransaction[] {
  const records = parse(content, {
    columns: (headers: string[]) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  return records
    .filter((row) => row.date && row.amount)
    .map((row) => {
      const rawAmount = parseInterAmount(row.amount);
      const amount = Math.abs(rawAmount);
      const type: 'INCOME' | 'EXPENSE' = rawAmount >= 0 ? 'INCOME' : 'EXPENSE';
      const description = (row.description || 'Sem descrição').trim();
      const date = parseInterDate(row.date);

      return { date, amount, description, type };
    });
}
