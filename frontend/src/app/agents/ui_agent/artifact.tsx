import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
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

  const NEXTJS_TEMPLATE = {
    files: {
      ...commonFiles,
      "/pages/_app.js": {
        code: `import '../styles.css'

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}`,
      },
      "/pages/index.js": {
        code: `import ReactMarkdown from 'react-markdown'

export default function Home({ data }) {
  return (
    <div>
      <h1>Hello test {data}</h1>
      <ReactMarkdown>
        # Hello, *world*!
        ## Test
      </ReactMarkdown>
    </div>
  );
}
  
export function getServerSideProps() {
  return {
    props: { data: "world" },
  }
}
`,
      },
      "/next.config.js": {
        code: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`,
      },
      "/package.json": {
        code: JSON.stringify({
          name: "my-app",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "NEXT_TELEMETRY_DISABLED=1 next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: {
            next: "12.1.6", // @todo: update to the latest version
            react: "18.2.0",
            "react-dom": "18.2.0",
            "@next/swc-wasm-nodejs": "12.1.6",
            "react-markdown": "latest",
          },
        }),
      },
    },
    main: "/pages/index.js",
    environment: "node",
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
        <Sandpack
          template="nextjs"
          customSetup={{
            dependencies: {
              "react-markdown": "latest",
            },
          }}
          files={NEXTJS_TEMPLATE["files"]}
          entry={NEXTJS_TEMPLATE["main"]}
        />
      </ArtifactContent>
    </div>
  );
}
