import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginClient } from "@kubb/plugin-client";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginFaker } from "@kubb/plugin-faker";

export default defineConfig({
  root: ".",
  input: {
    path: "http://localhost:9999/docs/json",
  },
  output: {
    path: "src/generated",
    clean: true,
    format: "biome",
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
  ]
});
