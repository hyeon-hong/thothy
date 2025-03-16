import { useRouter } from 'next/navigation';

export function navigateTo(path: string) {
  const router = useRouter();
  router.push(path);
} 