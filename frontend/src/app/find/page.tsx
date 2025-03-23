"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FindPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/agent');
  }, [router]);
  
  return null;
} 