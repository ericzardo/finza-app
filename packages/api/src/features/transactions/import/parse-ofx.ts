import { parse as parseOFX } from 'ofx-js';
import type { PreviewTransaction } from './types';

interface OFXTransaction {
  TRNTYPE: string;
  DTPOSTED: string;
  TRNAMT: string;
  NAME?: string;
  MEMO?: string;
  FITID?: string;
}

interface OFXStatementResponse {
  BANKTRANLIST?: {
    STMTTRN?: OFXTransaction | OFXTransaction[];
  };
}

export interface OFXParsedData {
  OFX?: {
    BANKMSGSRSV1?: {
      STMTTRNRS?: {
        STMTRS?: OFXStatementResponse;
      };
    };
    CREDITCARDMSGSRSV1?: {
      CCSTMTTRNRS?: {
        CCSTMTRS?: OFXStatementResponse;
      };
    };
  };
}

function parseOFXDate(raw: string): string {
  // OFX format: YYYYMMDDHHMMSS or YYYYMMDD or YYYYMMDDHHMMSS[-3:BRT]
  const cleaned = raw.replace(/\[.*\]/, '').trim();
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);

  return new Date(`${year}-${month}-${day}T12:00:00.000Z`).toISOString();
}

export async function parseOfx(content: string): Promise<PreviewTransaction[]> {
  const ofxData = (await parseOFX(content)) as unknown as OFXParsedData;

  const statementResponse =
    ofxData.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS ??
    ofxData.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;

  if (!statementResponse) {
    throw new Error(
      'Estrutura OFX inválida: não foi possível localizar as transações',
    );
  }

  const rawTransactions = statementResponse.BANKTRANLIST?.STMTTRN;

  if (!rawTransactions) {
    return [];
  }

  // ofx-js pode retornar um único objeto ou um array
  const transactions: OFXTransaction[] = Array.isArray(rawTransactions)
    ? rawTransactions
    : [rawTransactions];

  return transactions.map((trn) => {
    const rawAmount = Number.parseFloat(trn.TRNAMT);
    const amount = Math.abs(rawAmount);
    const type: 'INCOME' | 'EXPENSE' = rawAmount >= 0 ? 'INCOME' : 'EXPENSE';
    const description = (trn.NAME || trn.MEMO || 'Sem descrição').trim();
    const date = parseOFXDate(trn.DTPOSTED);

    return { date, amount, description, type };
  });
}
