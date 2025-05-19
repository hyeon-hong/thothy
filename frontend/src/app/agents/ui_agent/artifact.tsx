import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import * as shadcnComponents from "@/lib/shadcn";
import dedent from "dedent";
import { aquaBlue } from "@codesandbox/sandpack-themes";

export default function UIGraphComponent(props: { code: string }) {
  // Get the data from an agent by two way
  // 1. Use the props from push_ui_message function
  // 2. Use the context from the artifact

  const { meta } = useStreamContext<{ MetaType: { ui: any; artifact: any } }>();
  const [ArtifactContent, { open, setOpen }] = meta.artifact;

  const commonFiles = {
    "/styles.css": {
      code: `body {
  font-family: sans-serif;
  -webkit-font-smoothing: auto;
  -moz-font-smoothing: auto;
  -moz-osx-font-smoothing: grayscale;
  font-smoothing: auto;
  text-rendering: optimizeLegibility;
  font-smooth: always;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

h1 {
  font-size: 1.5rem;
}`,
    },
  };

  const REACT_TEMPLATE = {
    files: {
      ...commonFiles,
      "/App.js": {
        code: props.code,
      },
      "/index.js": {
        code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      },
      "/public/index.html": {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      },
      "/package.json": {
        code: JSON.stringify({
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            "react-scripts": "^5.0.0",
          },
          main: "/index.js",
        }),
      },
    },
    main: "/App.js",
    environment: "create-react-app",
  };

  const sharedFiles = {
    "/lib/utils.ts": shadcnComponents.utils,
    "/components/ui/accordion.tsx": shadcnComponents.accordian,
    "/components/ui/alert-dialog.tsx": shadcnComponents.alertDialog,
    "/components/ui/alert.tsx": shadcnComponents.alert,
    "/components/ui/avatar.tsx": shadcnComponents.avatar,
    "/components/ui/badge.tsx": shadcnComponents.badge,
    "/components/ui/breadcrumb.tsx": shadcnComponents.breadcrumb,
    "/components/ui/button.tsx": shadcnComponents.button,
    "/components/ui/calendar.tsx": shadcnComponents.calendar,
    "/components/ui/card.tsx": shadcnComponents.card,
    "/components/ui/carousel.tsx": shadcnComponents.carousel,
    "/components/ui/checkbox.tsx": shadcnComponents.checkbox,
    "/components/ui/collapsible.tsx": shadcnComponents.collapsible,
    "/components/ui/dialog.tsx": shadcnComponents.dialog,
    "/components/ui/drawer.tsx": shadcnComponents.drawer,
    "/components/ui/dropdown-menu.tsx": shadcnComponents.dropdownMenu,
    "/components/ui/input.tsx": shadcnComponents.input,
    "/components/ui/label.tsx": shadcnComponents.label,
    "/components/ui/menubar.tsx": shadcnComponents.menuBar,
    "/components/ui/navigation-menu.tsx": shadcnComponents.navigationMenu,
    "/components/ui/pagination.tsx": shadcnComponents.pagination,
    "/components/ui/popover.tsx": shadcnComponents.popover,
    "/components/ui/progress.tsx": shadcnComponents.progress,
    "/components/ui/radio-group.tsx": shadcnComponents.radioGroup,
    "/components/ui/select.tsx": shadcnComponents.select,
    "/components/ui/separator.tsx": shadcnComponents.separator,
    "/components/ui/skeleton.tsx": shadcnComponents.skeleton,
    "/components/ui/slider.tsx": shadcnComponents.slider,
    "/components/ui/switch.tsx": shadcnComponents.switchComponent,
    "/components/ui/table.tsx": shadcnComponents.table,
    "/components/ui/tabs.tsx": shadcnComponents.tabs,
    "/components/ui/textarea.tsx": shadcnComponents.textarea,
    "/components/ui/toast.tsx": shadcnComponents.toast,
    "/components/ui/toaster.tsx": shadcnComponents.toaster,
    "/components/ui/toggle-group.tsx": shadcnComponents.toggleGroup,
    "/components/ui/toggle.tsx": shadcnComponents.toggle,
    "/components/ui/tooltip.tsx": shadcnComponents.tooltip,
    "/components/ui/use-toast.tsx": shadcnComponents.useToast,
    "/public/index.html": dedent`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `,
  };

  const sharedProps = {
    template: "react-ts",
    theme: aquaBlue,
    customSetup: {
      dependencies: {
        "lucide-react": "latest",
        recharts: "2.9.0",
        "react-router-dom": "latest",
        "@radix-ui/react-accordion": "^1.2.0",
        "@radix-ui/react-alert-dialog": "^1.1.1",
        "@radix-ui/react-aspect-ratio": "^1.1.0",
        "@radix-ui/react-avatar": "^1.1.0",
        "@radix-ui/react-checkbox": "^1.1.1",
        "@radix-ui/react-collapsible": "^1.1.0",
        "@radix-ui/react-dialog": "^1.1.1",
        "@radix-ui/react-dropdown-menu": "^2.1.1",
        "@radix-ui/react-hover-card": "^1.1.1",
        "@radix-ui/react-label": "^2.1.0",
        "@radix-ui/react-menubar": "^1.1.1",
        "@radix-ui/react-navigation-menu": "^1.2.0",
        "@radix-ui/react-popover": "^1.1.1",
        "@radix-ui/react-progress": "^1.1.0",
        "@radix-ui/react-radio-group": "^1.2.0",
        "@radix-ui/react-select": "^2.1.1",
        "@radix-ui/react-separator": "^1.1.0",
        "@radix-ui/react-slider": "^1.2.0",
        "@radix-ui/react-slot": "^1.1.0",
        "@radix-ui/react-switch": "^1.1.0",
        "@radix-ui/react-tabs": "^1.1.0",
        "@radix-ui/react-toast": "^1.2.1",
        "@radix-ui/react-toggle": "^1.1.0",
        "@radix-ui/react-toggle-group": "^1.1.0",
        "@radix-ui/react-tooltip": "^1.1.2",
        "class-variance-authority": "^0.7.0",
        clsx: "^2.1.1",
        "date-fns": "^3.6.0",
        "embla-carousel-react": "^8.1.8",
        "react-day-picker": "^8.10.1",
        "tailwind-merge": "^2.4.0",
        "tailwindcss-animate": "^1.0.7",
        vaul: "^0.9.1",
      },
    },
  } as const;

  const sharedOptions = {
    externalResources: [
      "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
    ],
  };

  useEffect(() => {
    setOpen(true);
  }, [props.code]);

  return (
    <div className="bg-red-500">
      <button
        className="mb-2 px-2 py-1 rounded bg-white text-black border border-gray-300 hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Show"}
      </button>
      <div>Code</div>
      <ArtifactContent title={<div>Code</div>}>
        <SandpackProvider
          options={{
            ...sharedOptions,
          }}
          // files={REACT_TEMPLATE["files"]}
          files={{
            "App.tsx": props.code,
            ...sharedFiles,
          }}
          {...sharedProps}
        >
          <SandpackLayout>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <SandpackPreview />
              <SandpackCodeEditor wrapContent />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </ArtifactContent>
    </div>
  );
}
