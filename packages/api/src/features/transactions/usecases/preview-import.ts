import { AppError, ErrorCode } from '@errors/app-error';
import { detectFormat } from '@features/transactions/import/detect-format';
import { parseInterCsv } from '@features/transactions/import/parse-inter-csv';
import { parseNubankCsv } from '@features/transactions/import/parse-nubank-csv';
import { parseOfx } from '@features/transactions/import/parse-ofx';
import type {
  ImportFormat,
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

  let transactions: PreviewTransaction[];
  try {
    switch (format) {
      case 'OFX':
        transactions = await parseOfx(content);
        break;
      case 'NUBANK_CSV':
        transactions = parseNubankCsv(content);
        break;
      case 'INTER_CSV':
        transactions = parseInterCsv(content);
        break;
    }
  } catch (error) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      `Erro ao processar o arquivo: ${error instanceof Error ? error.message : 'falha desconhecida'}`,
    );
  }

  if (transactions.length === 0) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'Nenhuma transação encontrada no arquivo',
    );
  }

  return {
    format,
    transactions,
    count: transactions.length,
  };
}
