import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "prod", "test"]).default("dev"),
	API_URL: z.string().url().default("http://localhost:9999"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env as Record<string, unknown>);

export default env;
