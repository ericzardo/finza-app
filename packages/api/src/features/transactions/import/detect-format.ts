import type { ImportFormat } from './types';

const NUBANK_HEADERS = [
  'date,title,amount', // conta corrente EN
  'date,description,amount', // variante
  'data,título,valor', // PT-BR
  'data,titulo,valor', // PT-BR sem acento
];

const INTER_KEYWORDS = ['data lançamento', 'data lancamento'];

const MAX_HEADER_SCAN_LINES = 15;

function normalizeLine(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s*;\s*/g, ';');
}

function getLines(content: string, max: number): string[] {
  return content.split(/\r?\n/, max);
}

export function detectFormat(filename: string, content: string): ImportFormat {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'ofx' || ext === 'qfx') {
    return 'OFX';
  }

  if (ext === 'csv') {
    const rawLines = getLines(content, MAX_HEADER_SCAN_LINES);

    // Escaneia as primeiras linhas procurando padrões de cada banco.
    // Extratos do Inter frequentemente têm 5-6 linhas de metadados antes
    // do cabeçalho real.
    for (const raw of rawLines) {
      const line = normalizeLine(raw);
      if (!line) continue;

      for (const keyword of INTER_KEYWORDS) {
        if (line.includes(keyword)) {
          return 'INTER_CSV';
        }
      }

      // Heurística: linha com ";" contendo "data" e "valor" (ou "historico")
      if (
        line.includes(';') &&
        line.includes('data') &&
        (line.includes('valor') || line.includes('historico') || line.includes('histórico'))
      ) {
        return 'INTER_CSV';
      }
    }

    // Nubank: header na 1ª linha, delimitador vírgula
    const firstLine = normalizeLine(rawLines[0] ?? '').replace(/\s*,\s*/g, ',');
    for (const header of NUBANK_HEADERS) {
      if (firstLine.startsWith(header)) {
        return 'NUBANK_CSV';
      }
    }

    throw new Error(
      'Formato CSV não reconhecido. Envie um CSV do Nubank ou Banco Inter.',
    );
  }

  throw new Error(
    `Extensão ".${ext}" não suportada. Envie um arquivo .ofx, .qfx ou .csv`,
  );
}
