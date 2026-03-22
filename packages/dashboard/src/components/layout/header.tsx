import { UserAvatarMenu } from "@features/user/components/user-avatar-menu";
import { useAuth } from "@features/auth/context/auth-context";
import { Link } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { Skeleton } from "@ui/skeleton";
import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { user, isLoading, isAuthenticated } = useAuth();

	return (
		<header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl h-14 items-center px-6">
				{/* Logo */}
				<div className="flex flex-1 items-center">
					<Link to="/" className="flex items-center">
						<img src="/logo.svg" alt="Finza Logo" className="h-5.5 w-auto" />
					</Link>
				</div>

				{/* Nav */}
				<nav className="hidden items-center gap-6 md:flex">
					<Link
						to="/"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Home
					</Link>
					<a
						href="#features"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Recursos
					</a>
				</nav>

				{/* Actions */}
				<div className="hidden flex-1 items-center justify-end gap-3 md:flex">
					{isLoading ? (
						<Skeleton className="size-8 animate-pulse rounded-full" />
					) : isAuthenticated && user ? (
						<div className="flex items-center gap-3">
							<Button variant="accent" size="sm" asChild>
								<Link to="/dashboard">
									<LayoutDashboard className="size-3.5" />
									Dashboard
								</Link>
							</Button>
							<UserAvatarMenu user={user} />
						</div>
					) : (
						<>
							<Button variant="ghost" size="sm" asChild>
								<Link
									to="/login"
									className="text-muted-foreground hover:text-foreground"
								>
									Entrar
								</Link>
							</Button>
							<Button variant="accent" size="sm" asChild>
								<Link to="/sign-up">
									Criar conta
									<ArrowRight data-icon="inline-end" className="size-3.5" />
								</Link>
							</Button>
						</>
					)}
				</div>

				{/* Hamburger */}
				<div className="flex items-center gap-2 md:hidden">
					{isAuthenticated && user && <UserAvatarMenu user={user} />}
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => setMobileMenuOpen(true)}
						aria-label="Abrir menu"
					>
						<Menu className="size-5" />
					</Button>
				</div>
			</div>

			{/* Mobile drawer overlay */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setMobileMenuOpen(false)}
					/>

					{/* Panel */}
					<div className="absolute inset-x-0 top-0 animate-in slide-in-from-top-2 border-b border-border/50 bg-background p-6 duration-200">
						<div className="mb-6 flex items-center justify-between">
							<Link
								to="/"
								className="flex items-center"
								onClick={() => setMobileMenuOpen(false)}
							>
								<img src="/logo.svg" alt="Finza Logo" className="h-5 w-auto" />
							</Link>
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-muted-foreground hover:text-foreground"
								onClick={() => setMobileMenuOpen(false)}
								aria-label="Fechar menu"
							>
								<X className="size-5" />
							</Button>
						</div>

						<nav className="mb-6 flex flex-col gap-4">
							<Link
								to="/"
								className="text-base text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => setMobileMenuOpen(false)}
							>
								Home
							</Link>
							<a
								href="#features"
								className="text-base text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => setMobileMenuOpen(false)}
							>
								Recursos
							</a>
						</nav>

						<div className="flex flex-col gap-3">
							{isLoading ? (
								<div className="h-9 w-full animate-pulse rounded-md bg-muted" />
							) : isAuthenticated ? (
								<Button
									variant="accent"
									size="default"
									asChild
									className="w-full justify-center"
								>
									<Link
										to="/dashboard"
										onClick={() => setMobileMenuOpen(false)}
									>
										<LayoutDashboard className="size-3.5" />
										Dashboard
									</Link>
								</Button>
							) : (
								<>
									<Button
										variant="ghost"
										size="default"
										asChild
										className="w-full justify-center"
									>
										<Link
											to="/login"
											className="text-muted-foreground hover:text-foreground"
											onClick={() => setMobileMenuOpen(false)}
										>
											Entrar
										</Link>
									</Button>
									<Button
										variant="accent"
										size="default"
										asChild
										className="w-full justify-center"
									>
										<Link
											to="/sign-up"
											onClick={() => setMobileMenuOpen(false)}
										>
											Criar conta
											<ArrowRight data-icon="inline-end" className="size-3.5" />
										</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
