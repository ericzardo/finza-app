export type Env = {
  NODE_ENV: 'dev' | 'prod' | 'test'
  API_URL: string
  APP_URL: string
}

const nodeEnv: Env['NODE_ENV'] = import.meta.env.NODE_ENV
const apiUrl: Env['API_URL'] = import.meta.env.VITE_API_URL ?? 'http://localhost:9999'
const appUrl: Env['APP_URL'] = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000'

export const env: Env = {
  NODE_ENV: nodeEnv,
  API_URL: apiUrl,
  APP_URL: appUrl,
}

export default env
