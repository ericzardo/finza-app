import { describe, expect, test } from 'bun:test';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';
import env from '@env';
import { ErrorCode } from '@errors/app-error';
import { setupTestServer } from '@utils/test-setup';
import {
  profileResponseSchema,
  signupResponseSchema,
  togglePrivacyResponseSchema,
  updateProfileResponseSchema,
} from './schemas';

type SignupBody = {
  name: string;
  email: string;
  password: string;
};

const COOKIE_NAME = 'finza_token';

async function createUser(server: FastifyInstance, data: SignupBody) {
  return server.inject({
    method: 'POST',
    url: '/users',
    payload: data,
  });
}

async function ensureBetaPlan(server: FastifyInstance) {
  return server.prisma.plan.upsert({
    where: { slug: 'beta' },
    update: {},
    create: {
      slug: 'beta',
      name: 'Versao BETA',
      price: 0,
      features: {
        max_workspaces: 3,
      },
    },
  });
}

async function createTestUser(
  server: FastifyInstance,
  options: { isPrivacyEnabled?: boolean } = {},
) {
  const plan = await ensureBetaPlan(server);

  return server.prisma.user.create({
    data: {
      name: 'Profile User',
      email: uniqueEmail('profile'),
      password: 'hashed-password',
      plan_id: plan.id,
      is_privacy_enabled: options.isPrivacyEnabled ?? false,
    },
  });
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.com`;
}

function buildAuthCookie(user: { id: string; email: string }) {
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return {
    [COOKIE_NAME]: token,
  };
}

describe('POST /users', () => {
  test('sucesso', async () => {
    const server = await setupTestServer();

    try {
      await ensureBetaPlan(server);
      const email = uniqueEmail('user');
      const response = await createUser(server, {
        name: 'User One',
        email,
        password: 'StrongPass123!',
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();
      const parsed = signupResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(
          'Resposta nao corresponde ao schema SignupResponse: ' +
            JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.email).toBe(email);
      expect(parsed.data.plan).toBe('beta');
      expect(parsed.data.avatar_url).toBe('/avatars/1.webp');

      // Verifica que workspace padrão foi criado
      const user = await server.prisma.user.findUnique({
        where: { email },
      });
      const members = await server.prisma.workspaceMember.findMany({
        where: { user_id: user!.id },
        include: { workspace: true },
      });
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe('OWNER');
      expect(members[0].workspace.name).toBe('Meu Workspace');

      const categories = await server.prisma.category.findMany({
        where: { workspace_id: members[0].workspace.id },
      });
      expect(categories).toHaveLength(7);
    } finally {
      await server.close();
    }
  });

  test('validacao de dados', async () => {
    const server = await setupTestServer();

    try {
      const response = await createUser(server, {
        name: '',
        email: 'not-an-email',
        password: '123',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    } finally {
      await server.close();
    }
  });

  test('email ja existente', async () => {
    const server = await setupTestServer();

    try {
      await ensureBetaPlan(server);
      const email = uniqueEmail('existing');

      await createUser(server, {
        name: 'User Two',
        email,
        password: 'StrongPass123!',
      });

      const response = await createUser(server, {
        name: 'User Two Again',
        email,
        password: 'StrongPass123!',
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.CONFLICT);
    } finally {
      await server.close();
    }
  });
});

describe('GET /profile', () => {
  test('retorna dados do usuário autenticado', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server, { isPrivacyEnabled: true });
      const response = await server.inject({
        method: 'GET',
        url: '/profile',
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(200);
      const parsed = profileResponseSchema.safeParse(response.json());
      if (!parsed.success) {
        throw new Error(
          'Resposta nao corresponde ao schema ProfileResponse: ' +
            JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.id).toBe(user.id);
      expect(parsed.data.email).toBe(user.email);
      expect(parsed.data.plan).toBe('beta');
      expect(parsed.data.avatar_url).toBe('/avatars/1.webp');
      expect(parsed.data.is_privacy_enabled).toBe(true);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie nao for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/profile',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });

  test('retorna 404 quando usuário não existir', async () => {
    const server = await setupTestServer();

    try {
      const cookies = buildAuthCookie({
        id: 'missing-user',
        email: 'missing@example.com',
      });

      const response = await server.inject({
        method: 'GET',
        url: '/profile',
        cookies,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.NOT_FOUND);
    } finally {
      await server.close();
    }
  });
});

describe('PATCH /profile/privacy', () => {
  test('ativa a privacidade quando estava desativada', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server, { isPrivacyEnabled: false });
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile/privacy',
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(200);
      const parsed = togglePrivacyResponseSchema.safeParse(response.json());
      if (!parsed.success) {
        throw new Error(
          'Resposta nao corresponde ao schema TogglePrivacyResponse: ' +
            JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.is_privacy_enabled).toBe(true);
    } finally {
      await server.close();
    }
  });

  test('desativa a privacidade quando estava ativada', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server, { isPrivacyEnabled: true });
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile/privacy',
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.is_privacy_enabled).toBe(false);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie nao for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile/privacy',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });

  test('retorna 404 quando usuário não existir', async () => {
    const server = await setupTestServer();

    try {
      const cookies = buildAuthCookie({
        id: 'missing-user',
        email: 'missing@example.com',
      });

      const response = await server.inject({
        method: 'PATCH',
        url: '/profile/privacy',
        cookies,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.NOT_FOUND);
    } finally {
      await server.close();
    }
  });
});

describe('PATCH /profile', () => {
  test('atualiza o nome do usuário', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user),
        payload: { name: 'Novo Nome' },
      });

      expect(response.statusCode).toBe(200);
      const parsed = updateProfileResponseSchema.safeParse(response.json());
      if (!parsed.success) {
        throw new Error(
          'Resposta nao corresponde ao schema: ' + JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.name).toBe('Novo Nome');
      expect(parsed.data.email).toBe(user.email);
      expect(parsed.data.plan).toBe('beta');
    } finally {
      await server.close();
    }
  });

  test('atualiza o avatar_url do usuário', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user),
        payload: { avatar_url: 'https://example.com/new-avatar.png' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.avatar_url).toBe('https://example.com/new-avatar.png');
    } finally {
      await server.close();
    }
  });

  test('atualiza o email e reseta email_verified_at', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const newEmail = uniqueEmail('new-email');

      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user),
        payload: { email: newEmail },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.email).toBe(newEmail);
      expect(body.email_verified_at).toBeNull();
    } finally {
      await server.close();
    }
  });

  test('retorna 409 quando novo email já está em uso', async () => {
    const server = await setupTestServer();

    try {
      const user1 = await createTestUser(server);
      const user2 = await createTestUser(server);

      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user1),
        payload: { email: user2.email },
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.CONFLICT);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie nao for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        payload: { name: 'Sem Auth' },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });

  test('retorna 404 quando usuário não existir', async () => {
    const server = await setupTestServer();

    try {
      const cookies = buildAuthCookie({
        id: 'missing-user',
        email: 'missing@example.com',
      });

      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies,
        payload: { name: 'Ghost' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.NOT_FOUND);
    } finally {
      await server.close();
    }
  });

  test('retorna 400 para dados inválidos', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user),
        payload: { email: 'not-an-email' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    } finally {
      await server.close();
    }
  });

  test('atualiza múltiplos campos simultaneamente', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const newEmail = uniqueEmail('multi');

      const response = await server.inject({
        method: 'PATCH',
        url: '/profile',
        cookies: buildAuthCookie(user),
        payload: {
          name: 'Multi Update',
          email: newEmail,
          avatar_url: 'https://example.com/multi.png',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Multi Update');
      expect(body.email).toBe(newEmail);
      expect(body.avatar_url).toBe('https://example.com/multi.png');
    } finally {
      await server.close();
    }
  });
});
