import type { FastifyError, FastifyPluginAsync } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import fp from 'fastify-plugin';
import { AppError, ErrorCode } from '@errors/app-error';

type ValidationErrorItem = {
  instancePath?: string;
  dataPath?: string;
  message?: string;
};

type ValidationIssue = {
  field: string;
  message: string;
};

const getErrorStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined;
  }

  const { statusCode } = error as { statusCode?: unknown };

  return typeof statusCode === 'number' ? statusCode : undefined;
};

const isFastifyError = (
  error: unknown,
): error is FastifyError & { statusCode: number } =>
  typeof error === 'object' &&
  error !== null &&
  'statusCode' in error &&
  typeof (error as { statusCode: unknown }).statusCode === 'number';

const normalizeValidationIssues = (
  validationErrors: ReadonlyArray<ValidationErrorItem>,
): { issues: ValidationIssue[] } => {
  const issues = validationErrors.map((issue) => {
    const rawPath = issue.instancePath ?? issue.dataPath ?? '';
    const trimmedPath =
      rawPath.startsWith('/') || rawPath.startsWith('.')
        ? rawPath.slice(1)
        : rawPath;
    const field = trimmedPath.length > 0 ? trimmedPath : 'body';

    return {
      field,
      message: issue.message ?? 'Valor invalido',
    };
  });

  return { issues };
};

const statusCodeToErrorCode = (statusCode: number): ErrorCode => {
  if (statusCode >= 500) {
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  switch (statusCode) {
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    default:
      return ErrorCode.BAD_REQUEST;
  }
};

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = getErrorStatusCode(error);
    const shouldLogError = statusCode === undefined || statusCode >= 500;

    if (shouldLogError) {
      console.error(error);
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Dados de entrada inválidos',
        details: normalizeValidationIssues(error.validation),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (isFastifyError(error)) {
      return reply.status(error.statusCode).send({
        code: statusCodeToErrorCode(error.statusCode),
        message: error.message,
        details: undefined,
      });
    }

    return reply.status(500).send({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Ocorreu um erro interno no servidor',
      details: undefined,
    });
  });
};

export default fp(errorHandlerPlugin, { name: 'error-handler' });
