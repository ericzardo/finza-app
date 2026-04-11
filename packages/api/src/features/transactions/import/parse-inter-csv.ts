import { parse } from 'csv-parse/sync';
import type { ParseResult, PreviewTransaction } from './types';

// Banco Inter exporta CSV com delimitador ";" e headers como:
// "Data Lançamento";"Histórico";"Descrição";"Valor";"Saldo"
// Extratos reais frequentemente possuem 5-6 linhas de metadados antes do header
// (ex: "Extrato Conta Corrente", "Período: ...", "Saldo ;1.037,40").

const HEADER_MAP: Record<string, string> = {
  'data lançamento': 'date',
  'data lancamento': 'date',
  data: 'date',
  descrição: 'description',
  descricao: 'description',
  historico: 'historico',
  histórico: 'historico',
  lançamento: 'lancamento',
  lancamento: 'lancamento',
  valor: 'amount',
  saldo: '_saldo',
};

const HEADER_REQUIRED_FIELDS = ['data', 'valor'];

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const key = h
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, '');
    return HEADER_MAP[key] ?? key;
  });
}

function findHeaderLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i]
      .toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s*;\s*/g, ';');

    const hasAllRequired = HEADER_REQUIRED_FIELDS.every((field) =>
      lower.includes(field),
    );

    if (hasAllRequired) {
      return i;
    }
  }
  return -1;
}

function parseInterDate(raw: string): string {
  // dd/mm/yyyy → ISO string
  const parts = raw.trim().split('/');
  if (parts.length !== 3) {
    throw new Error(`Data inválida no CSV Inter: "${raw}"`);
  }
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}T12:00:00.000Z`).toISOString();
}

function parseInterAmount(raw: string): number {
  // "1.234,56" → 1234.56 | "-50,00" → -50.00 | "1234,56" → 1234.56
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Valor inválido no CSV Inter: "${raw}"`);
  }
  return value;
}

function buildDescription(row: Record<string, string>): string {
  const parts: string[] = [];

  if (row.historico?.trim()) {
    parts.push(row.historico.trim());
  }

  // "description" vem do mapeamento de "Descrição" no HEADER_MAP
  if (row.description?.trim()) {
    parts.push(row.description.trim());
  }

  if (row.lancamento?.trim()) {
    parts.push(row.lancamento.trim());
  }

  return parts.length > 0 ? parts.join(' - ') : 'Sem descrição';
}

function extractBalanceFromMetadata(
  lines: string[],
  headerIndex: number,
): number | null {
  for (let i = 0; i < headerIndex; i++) {
    const line = lines[i].trim();
    if (!/^saldo\s*;/i.test(line)) continue;

    const parts = line.split(';');
    if (parts.length < 2) continue;

    const rawValue = parts[1].trim().replace(/\./g, '').replace(',', '.');
    const value = Number.parseFloat(rawValue);
    if (!Number.isNaN(value)) return value;
  }
  return null;
}

export function parseInterCsv(content: string): ParseResult {
  const allLines = content.split(/\r?\n/);
  const headerIndex = findHeaderLineIndex(allLines);

  const extractedBalance = extractBalanceFromMetadata(
    allLines,
    headerIndex > 0 ? headerIndex : allLines.length,
  );

  // Se não encontrou header, tenta parsear do início (fallback)
  const csvContent =
    headerIndex > 0 ? allLines.slice(headerIndex).join('\n') : content;

  const records = parse(csvContent, {
    columns: (headers: string[]) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  const transactions: PreviewTransaction[] = records
    .filter((row) => row.date && row.amount)
    .map((row) => {
      const rawAmount = parseInterAmount(row.amount);
      const amount = Math.abs(rawAmount);
      const type: 'INCOME' | 'EXPENSE' = rawAmount >= 0 ? 'INCOME' : 'EXPENSE';
      const description = buildDescription(row);
      const date = parseInterDate(row.date);

      return { date, amount, description, type };
    });

  return { transactions, extractedBalance };
}
