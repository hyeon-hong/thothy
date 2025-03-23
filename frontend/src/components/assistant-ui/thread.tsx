import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { useEffect } from "react";
import React from "react";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

// Simple icon components
const ArrowDownIcon = () => <span>↓</span>;
const CheckIcon = () => <span>✓</span>;
const ChevronLeftIcon = () => <span>←</span>;
const ChevronRightIcon = () => <span>→</span>;
const CopyIcon = () => <span>📋</span>;
const PencilIcon = () => <span>✎</span>;
const RefreshCwIcon = () => <span>🔄</span>;
const SendHorizontalIcon = () => <span>➤</span>;
const CircleStopIcon = () => <span>⏹</span>;

type ThreadProps = {
  welcomeSuggestions?: { prompt: string }[];
  toolFallback?: any; // Using any to avoid type issues
};

// Use explicit React function declarations instead of FC
export function Thread({ 
  welcomeSuggestions = [
    { prompt: "What is the weather in Tokyo?" },
    { prompt: "What is assistant-ui?" }
  ],
  toolFallback
}: ThreadProps): React.ReactNode {
  // Log when Thread component initializes
  useEffect(() => {
    console.log('[Thread] Thread component initialized');
    console.log('[Thread] ToolFallback provided:', !!toolFallback);
  }, [toolFallback]);

  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
        <ThreadWelcome suggestions={welcomeSuggestions} />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: (props) => <UserMessage {...props} />,
            EditComposer: (props) => <EditComposer {...props} />,
            AssistantMessage: (props) => {
              console.log('[Thread] Rendering AssistantMessage');
              return (
                <AssistantMessage 
                  {...props} 
                  toolFallback={toolFallback} 
                />
              );
            },
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function ThreadScrollToBottom(): React.ReactNode {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
}

function ThreadWelcome({ suggestions }: { suggestions: { prompt: string }[] }): React.ReactNode {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <p className="mt-4 font-medium">
            How can I help you today?
          </p>
        </div>
        <ThreadWelcomeSuggestions suggestions={suggestions} />
      </div>
    </ThreadPrimitive.Empty>
  );
}

function ThreadWelcomeSuggestions({ suggestions }: { suggestions: { prompt: string }[] }): React.ReactNode {
  return (
    <div className="mt-3 flex w-full items-stretch justify-center gap-4">
      {suggestions.map((suggestion, index) => (
        <ThreadPrimitive.Suggestion
          key={index}
          className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
          prompt={suggestion.prompt}
          method="replace"
          autoSend
        >
          <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
            {suggestion.prompt}
          </span>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

function Composer(): React.ReactNode {
  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Write a message..."
        className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
}

function ComposerAction(): React.ReactNode {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
}

function UserMessage(): React.ReactNode {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />

      <div className="bg-muted text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
}

function UserActionBar(): React.ReactNode {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
}

function EditComposer(): React.ReactNode {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}

function AssistantMessage({ toolFallback }: { toolFallback?: any }): React.ReactNode {
  useEffect(() => {
    console.log('[AssistantMessage] Component mounted');
  }, []);

  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
        <MessagePrimitive.Content 
          components={{ 
            Text: MarkdownText,
            tools: toolFallback ? { Fallback: toolFallback } : undefined,
          }} 
        />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
}

function AssistantActionBar(): React.ReactNode {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="flex flex-col items-end row-start-1 mt-1.5 mr-4"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <CopyIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
}

function BranchPicker({ className, ...rest }: BranchPickerPrimitive.Root.Props): React.ReactNode {
  return (
    <BranchPickerPrimitive.Root
      className={cn("flex items-center", className)}
      {...rest}
    >
      <div className="flex flex-col">
        <BranchPickerPrimitive.Root.Group className="flex items-center overflow-auto py-1">
          <BranchPickerPrimitive.Previous asChild>
            <TooltipIconButton tooltip="Previous" variant="ghost">
              <ChevronLeftIcon />
            </TooltipIconButton>
          </BranchPickerPrimitive.Previous>

          <BranchPickerPrimitive.Root.Markers
            className="mx-2 hidden space-x-1.5 sm:flex"
            activeClassName="bg-foreground"
            inactiveClassName="hover:bg-foreground/30 bg-foreground/20"
            commonClassName="w-1.5 h-1.5 rounded-sm transition-colors duration-100 ease-in-out cursor-pointer"
          />

          <BranchPickerPrimitive.Root.Progress className="mx-2 sm:hidden" />

          <BranchPickerPrimitive.Next asChild>
            <TooltipIconButton tooltip="Next" variant="ghost">
              <ChevronRightIcon />
            </TooltipIconButton>
          </BranchPickerPrimitive.Next>
        </BranchPickerPrimitive.Root.Group>
      </div>
    </BranchPickerPrimitive.Root>
  );
}

// Export BranchPicker to make it available to other components
export { BranchPicker };
