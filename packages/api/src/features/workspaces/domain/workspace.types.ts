import type { Category, Workspace, WorkspaceRole } from '@prisma/client';

export type WorkspaceWithRole = Pick<Workspace, 'id' | 'name' | 'currency'> & {
  role: WorkspaceRole;
  totalBalance: number;
  created_at: string;
};

export type DefaultCategory = Pick<Category, 'name' | 'icon' | 'color'>;

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Alimentação', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { name: 'Moradia', icon: '🏠', color: '#45B7D1' },
  { name: 'Saúde', icon: '💊', color: '#96CEB4' },
  { name: 'Educação', icon: '📚', color: '#FFEAA7' },
  { name: 'Lazer', icon: '🎮', color: '#DDA0DD' },
  { name: 'Outros', icon: '📦', color: '#95A5A6' },
];
