import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";

export default function UIGraphComponent(props: { code: string }) {
  // Get the data from an agent by two way
  // 1. Use the props from push_ui_message function
  // 2. Use the context from the artifact

  const { meta } = useStreamContext<{ MetaType: { ui: any; artifact: any } }>();
  const [ArtifactContent, { open, setOpen }] = meta.artifact;
  const [code, setCode] = useState<string>("");

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
        <Sandpack />
      </ArtifactContent>
    </div>
  );
}
