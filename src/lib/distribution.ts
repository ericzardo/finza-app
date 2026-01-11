import { Prisma } from "@prisma/client";

/**
 * Representa um alvo de distribuição (bucket destino)
 */
export interface DistributionTarget {
  bucketId: string;
  value: number; // Pode ser valor fixo ou porcentagem (0-100)
  isPercentage: boolean;
}

/**
 * Resultado do cálculo de distribuição para cada bucket
 */
export interface DistributionResult {
  bucketId: string;
  amount: Prisma.Decimal;
}

/**
 * Calcula a distribuição de um valor total entre múltiplos buckets
 * 
 * @param totalAmount - Valor total a ser distribuído
 * @param targets - Array de alvos (bucket + valor/porcentagem)
 * @returns Array de resultados com o valor calculado para cada bucket
 */
export function calculateDistribution(
  totalAmount: number | Prisma.Decimal,
  targets: DistributionTarget[]
): DistributionResult[] {
  const total = new Prisma.Decimal(totalAmount);
  const results: DistributionResult[] = [];
  let totalDistributed = new Prisma.Decimal(0);

  // Primeiro, calcula valores percentuais
  for (const target of targets) {
    if (target.isPercentage) {
      const percentage = target.value / 100;
      const shareAmount = Number(total) * percentage;
      const shareDecimal = new Prisma.Decimal(shareAmount);
      
      results.push({
        bucketId: target.bucketId,
        amount: shareDecimal,
      });
      
      totalDistributed = totalDistributed.add(shareDecimal);
    } else {
      // Valores fixos
      const shareDecimal = new Prisma.Decimal(target.value);
      
      results.push({
        bucketId: target.bucketId,
        amount: shareDecimal,
      });
      
      totalDistributed = totalDistributed.add(shareDecimal);
    }
  }

  return results;
}

/**
 * Calcula o remainder (sobra) após distribuição
 * 
 * @param totalAmount - Valor total distribuído
 * @param distributedAmount - Soma dos valores já distribuídos
 * @returns Valor restante
 */
export function calculateRemainder(
  totalAmount: number | Prisma.Decimal,
  distributedAmount: number | Prisma.Decimal
): Prisma.Decimal {
  const total = new Prisma.Decimal(totalAmount);
  const distributed = new Prisma.Decimal(distributedAmount);
  
  return total.minus(distributed);
}
