import { build } from '../app';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function exportOpenAPI() {
  const app = await build();

  await app.ready();

  const swagger = app.swagger();

  // 3. Salva no disco
  const outputPath = join(process.cwd(), 'docs', 'swagger.json');
  writeFileSync(outputPath, JSON.stringify(swagger, null, 2));

  console.log(
    '✅ Swagger Documentation exportada com sucesso para docs/swagger.json',
  );
  process.exit(0);
}

exportOpenAPI().catch((err) => {
  console.error('❌ Erro ao exportar Swagger Documentation:', err);
  process.exit(1);
});
