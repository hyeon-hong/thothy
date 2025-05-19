import { useThreadsContext } from "../context/threads-context";
import { ThreadValues } from "../types";

export function useThreads<T extends ThreadValues>() {
  const { threadData: threads } = useThreadsContext<T>();
  return { threads };
} 