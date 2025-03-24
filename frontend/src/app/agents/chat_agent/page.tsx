import "@/app/globals.css";
import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/react-router/v6";
import { BrowserRouter } from "react-router-dom";

export default function ChatAgentPage() {
  return (
    <BrowserRouter>
      <NuqsAdapter>
        <ThreadProvider>
          <StreamProvider>
            <Thread />
          </StreamProvider>
        </ThreadProvider>
        <Toaster />
      </NuqsAdapter>
    </BrowserRouter>
  );
}
