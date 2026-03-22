import { build } from './app';
import env from '@env';

const start = async () => {
  const app = await build();
  try {
    await app.listen({
      port: env.PORT || 9999,
      host: env.HOST || '0.0.0.0',
    });
    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}'`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
