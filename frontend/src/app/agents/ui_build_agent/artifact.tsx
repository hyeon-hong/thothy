import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";

export default function UIBuildGraphComponent(props: {
  score: number;
  analysis: string;
  original_ui: string;
  new_ui: string;
}) {
  // Get the data from an agent by two way
  // 1. Use the props from push_ui_message function
  // 2. Use the context from the artifact
  // We choose 1 because it's more flexible and easier to manage

  const { meta } = useStreamContext<{ MetaType: { ui: any; artifact: any } }>();
  const [ArtifactContent, { open, setOpen }] = meta.artifact;

  useEffect(() => {
    setOpen(true);
  }, [props.score, props.analysis]);

  return (
    <div className="h-full">
      <button
        className="mb-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? "Click to hide UI analysis" : "Click to display UI analysis"}
      </button>
      <ArtifactContent title={<div>UI Analysis</div>}>
        <div>
          <div>Original UI:</div>
          <img
            src={`data:image/png;base64,${props.original_ui}`}
            alt="Original UI"
            className="w-full mb-4"
          />

          <div>New UI:</div>
          <img
            src={`data:image/png;base64,${props.new_ui}`}
            alt="New UI"
            className="w-full"
          />
          <div>Score: {props.score}</div>
          <div>Analysis: {props.analysis}</div>
        </div>
      </ArtifactContent>
    </div>
  );
}
