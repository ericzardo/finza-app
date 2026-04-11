import { AppError, ErrorCode } from '@errors/app-error';
import { detectFormat } from '@features/transactions/import/detect-format';
import { parseInterCsv } from '@features/transactions/import/parse-inter-csv';
import { parseNubankCsv } from '@features/transactions/import/parse-nubank-csv';
import { parseOfx } from '@features/transactions/import/parse-ofx';
import type {
  ImportFormat,
  ParseResult,
  PreviewTransaction,
} from '@features/transactions/import/types';

interface PreviewImportInput {
  filename: string;
  buffer: Buffer;
}

interface PreviewImportResult {
  format: ImportFormat;
  transactions: PreviewTransaction[];
  count: number;
  extractedBalance: number | null;
}

export async function previewImport(
  input: PreviewImportInput,
): Promise<PreviewImportResult> {
  const { filename, buffer } = input;
  const content = buffer.toString('utf-8');

  if (!content.trim()) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'O arquivo enviado está vazio',
    );
  }

  let format: ImportFormat;
  try {
    format = detectFormat(filename, content);
  } catch (error) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      error instanceof Error
        ? error.message
        : 'Formato de arquivo não reconhecido',
    );
  }

  let result: ParseResult;
  try {
    switch (format) {
      case 'OFX':
        result = await parseOfx(content);
        break;
      case 'NUBANK_CSV':
        result = parseNubankCsv(content);
        break;
      case 'INTER_CSV':
        result = parseInterCsv(content);
        break;
    }
  } catch (error) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      `Erro ao processar o arquivo: ${error instanceof Error ? error.message : 'falha desconhecida'}`,
    );
  }

  if (result.transactions.length === 0) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'Nenhuma transação encontrada no arquivo',
    );
  }

  return {
    format,
    transactions: result.transactions,
    count: result.transactions.length,
    extractedBalance: result.extractedBalance,
  };
}
