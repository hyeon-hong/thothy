"use client";

import { Canvas } from "./components/canvas";
import { AssistantProvider } from "./contexts/AssistantContext";
import { GraphProvider } from "./contexts/GraphContext";
import { ThreadProvider } from "./contexts/ThreadProvider";
import { UserProvider } from "./contexts/UserContext";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function Home() {
  return (
    <NuqsAdapter>
      <Suspense>
        <UserProvider>
          <ThreadProvider>
            <AssistantProvider>
              <GraphProvider>
                <Canvas />
              </GraphProvider>
            </AssistantProvider>
          </ThreadProvider>
        </UserProvider>
      </Suspense>
    </NuqsAdapter>
  );
}
