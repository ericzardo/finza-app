import { build, getConfigs } from "@kubb/core";
import config from "../kubb.config.ts";

try {
	const configs = await getConfigs(config, {});

	for (const c of configs) {
		await build({ config: c });
	}

	console.log("✅ API Client generated successfully");
	process.exit(0);
} catch (error) {
	console.error("❌ Kubb generation failed:", error);
	process.exit(1);
}
