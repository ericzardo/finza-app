import { motion } from "framer-motion";

export function AppLoader() {
	return (
		<motion.div
			className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
		>
			<img src="/logo.svg" alt="Finza Logo" className="h-8 w-auto" />
			<div
				aria-label="Carregando"
				className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			/>
		</motion.div>
	);
}
