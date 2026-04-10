import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { previewImport } from '@features/transactions/usecases/preview-import';

export async function previewImportController(
  request: FastifyRequest,
  reply: FastifyReply,
  _fastify: FastifyInstance,
) {
  const file = await request.file();

  if (!file) {
    return reply.code(400).send({
      code: 'BAD_REQUEST',
      message: 'Nenhum arquivo enviado. Envie um arquivo .ofx, .qfx ou .csv',
    });
  }

  const buffer = await file.toBuffer();
  const filename = file.filename;

  const result = await previewImport({ filename, buffer });

  return reply.code(200).send(result);
}
