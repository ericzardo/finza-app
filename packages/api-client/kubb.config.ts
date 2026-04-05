import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig({
	root: ".",
	input: {
		path: "../api/docs/swagger.json",
	},
	output: {
		path: "src/generated",
		clean: true,
		format: process.env.DOCKER_BUILD ? undefined : "biome",
	},
	plugins: [
		pluginOas(),
		pluginTs(),
		pluginClient({
			importPath: "@client",
		}),
		pluginReactQuery({
			output: { path: "hooks" },
			suspense: false,
			client: {
				importPath: "@client",
			},
		}),
		pluginZod({
			output: { path: "schemas" },
		}),
		pluginMsw({
			output: { path: "mocks" },
		}),
		pluginFaker({
			output: { path: "mocks" },
		}),
	],
});
