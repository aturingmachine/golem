import { useAppStore, type SnackbarData } from '@/stores/app';

export function showSnackbar(params: Omit<SnackbarData, 'id'>): void {
  const app = useAppStore()

  app.promptSnackbar(params)
}
