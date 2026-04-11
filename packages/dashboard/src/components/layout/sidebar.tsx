import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeftRight,
	ChevronLeft,
	ChevronRight,
	Clock,
	CreditCard,
	LayoutDashboard,
	PiggyBank,
	Settings,
	Tag,
} from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

interface NavItem {
	label: string;
	icon: React.ReactNode;
	path: string;
}

function useNavItems(workspaceId: string): NavItem[] {
	return [
		{
			label: "Dashboard",
			icon: <LayoutDashboard className="size-5 shrink-0" />,
			path: `/${workspaceId}`,
		},
		{
			label: "Transações",
			icon: <ArrowLeftRight className="size-5 shrink-0" />,
			path: `/${workspaceId}/transactions`,
		},
		{
			label: "Pendências",
			icon: <Clock className="size-5 shrink-0" />,
			path: `/${workspaceId}/pending`,
		},
		{
			label: "Cartão de Crédito",
			icon: <CreditCard className="size-5 shrink-0" />,
			path: `/${workspaceId}/credit-cards`,
		},
		{
			label: "Caixas",
			icon: <PiggyBank className="size-5 shrink-0" />,
			path: `/${workspaceId}/buckets`,
		},
		{
			label: "Categorias",
			icon: <Tag className="size-5 shrink-0" />,
			path: `/${workspaceId}/categories`,
		},
		{
			label: "Configurações",
			icon: <Settings className="size-5 shrink-0" />,
			path: `/${workspaceId}/settings`,
		},
	];
}

export interface SidebarProps {
	className?: string;
	onNavigate?: () => void;
	collapsible?: boolean;
}

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export function Sidebar({ className, onNavigate, collapsible = true }: SidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
	const navItems = useNavItems(workspaceId);
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;

	const isCollapsed = collapsible && collapsed;

	return (
		<motion.aside
			animate={{ width: collapsible ? (isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH) : "100%" }}
			transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
			className={twMerge(
				"relative hidden h-screen shrink-0 flex-col border-r border-border/50 bg-card md:flex",
				className,
			)}
		>
			{/* Top: Logo */}
			<div className="flex h-14 items-center overflow-hidden border-b border-border/50 px-3">
				<Link to="/dashboard" className="flex shrink-0 items-center">
					<AnimatePresence initial={false} mode="wait">
						{isCollapsed ? (
							<motion.img
								key="favicon"
								src="/favicon.svg"
								alt="Finza"
								className="size-7 shrink-0"
								// initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								// exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
							/>
						) : (
							<motion.img
								key="logo"
								src="/logo.svg"
								alt="Finza"
								className="h-7 w-auto shrink-0"
								// initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								// exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
							/>
						)}
					</AnimatePresence>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
				{navItems.map((item) => {
					const isActive =
						item.path === `/${workspaceId}`
							? pathname === item.path || pathname === `/${workspaceId}/`
							: pathname.startsWith(item.path);

					return (
						<Link
							key={item.path}
							to={item.path}
							title={isCollapsed ? item.label : undefined}
							className={twMerge(
								"group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors duration-150",
								isActive
									? "bg-accent/15 text-accent"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
							onClick={onNavigate}
						>
							<span
								className={twMerge(
									"transition-transform duration-150 group-hover:scale-105",
									isActive && "text-accent",
								)}
							>
								{item.icon}
							</span>

							<AnimatePresence initial={false}>
								{!isCollapsed && (
									<motion.span
										key="label"
										initial={{ opacity: 0, x: -4 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -4 }}
										transition={{ duration: 0.15, ease: "easeOut" }}
										className="truncate font-medium"
									>
										{item.label}
									</motion.span>
								)}
							</AnimatePresence>
						</Link>
					);
				})}
			</nav>

			{/* Toggle button */}
			{collapsible && (
			<div className="border-t border-border/50 px-2 py-3">
				<button
					type="button"
					onClick={() => setCollapsed((prev) => !prev)}
					className="flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
					title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
				>
					<span className="flex shrink-0 items-center justify-center">
						{isCollapsed ? (
							<ChevronRight className="size-5" />
						) : (
							<ChevronLeft className="size-5" />
						)}
					</span>

					<AnimatePresence initial={false}>
						{!isCollapsed && (
							<motion.span
								key="toggle-label"
								initial={{ opacity: 0, x: -4 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -4 }}
								transition={{ duration: 0.15, ease: "easeOut" }}
								className="truncate font-medium"
							>
								Recolher
							</motion.span>
						)}
					</AnimatePresence>
				</button>
			</div>
			)}
		</motion.aside>
	);
}
