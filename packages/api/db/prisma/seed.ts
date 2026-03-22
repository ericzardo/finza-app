import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { plans } from '@config/plans';
import env from '@env';

const adapter = new PrismaPg({
  connectionString: env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  console.log('✅ Planos criados e sincronizados!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
