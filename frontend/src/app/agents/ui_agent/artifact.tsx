import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import Markdown from "react-markdown";

export default function UIGraphComponent(props: { code: string }) {
  // Get the data from an agent by two way
  // 1. Use the props from push_ui_message function
  // 2. Use the context from the artifact

  const { meta } = useStreamContext<{ MetaType: { ui: any; artifact: any } }>();
  const [ArtifactContent, { open, setOpen }] = meta.artifact;
  const [code, setCode] = useState<string>("");

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

  useEffect(() => {
    setCode("<Button>button</Button>");
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
          template="react"
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
          files={REACT_TEMPLATE["files"]}
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
