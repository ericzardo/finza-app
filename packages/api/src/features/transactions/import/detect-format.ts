import type { ImportFormat } from './types';

const NUBANK_HEADERS = [
  'date,title,amount', // conta corrente EN
  'date,description,amount', // variante
  'data,título,valor', // PT-BR
  'data,titulo,valor', // PT-BR sem acento
];

const INTER_HEADERS = ['data lançamento', 'data lancamento'];

function getFirstLine(content: string): string {
  const newlineIndex = content.indexOf('\n');
  const line =
    newlineIndex === -1 ? content : content.substring(0, newlineIndex);
  return line
    .trim()
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s*;\s*/g, ';');
}

export function detectFormat(filename: string, content: string): ImportFormat {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'ofx' || ext === 'qfx') {
    return 'OFX';
  }

  if (ext === 'csv') {
    const firstLine = getFirstLine(content);

    // Verifica headers do Inter (usa ; como delimitador)
    for (const header of INTER_HEADERS) {
      if (firstLine.includes(header)) {
        return 'INTER_CSV';
      }
    }

    // Verifica headers do Nubank (usa , como delimitador)
    const commaFirstLine = firstLine.replace(/\s*,\s*/g, ',');
    for (const header of NUBANK_HEADERS) {
      if (commaFirstLine.startsWith(header)) {
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
