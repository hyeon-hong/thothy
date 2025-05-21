import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { useEffect, useState } from "react";

export default function SlideBuildGraphComponent(props: {
  score: number;
  analysis: string;
  original_ui: string;
  new_ui: string;
  error: string;
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

  // Make sure we have fallbacks for missing data
  const analysisText = props.analysis || "No analysis available yet";
  const scoreValue = props.score !== undefined ? props.score : "Pending";

  return (
    <div className="h-full">
      <button
        className="mb-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? "Click to hide UI analysis" : "Click to display UI analysis"}
      </button>
      <ArtifactContent title={<div>UI Analysis</div>}>
        <div className="h-[600px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-medium mb-2">Original UI:</div>
              <div className="h-[200px] w-[200px] flex items-center justify-center border rounded">
                <img
                  src={`data:image/png;base64,${props.original_ui}`}
                  alt="Original UI"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    width: "auto",
                    height: "auto",
                  }}
                  className="object-contain"
                />
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">New UI:</div>
              <div className="h-[200px] w-[200px] flex items-center justify-center border rounded">
                <img
                  src={`data:image/png;base64,${props.new_ui}`}
                  alt="New UI"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    width: "auto",
                    height: "auto",
                  }}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border-2 border-blue-400 rounded bg-blue-50 flex-grow">
            <div className="text-lg font-bold mb-2 text-blue-800">
              Evaluation Results
            </div>
            <div className="mb-3">
              <span className="font-medium">Score:</span>{" "}
              <span className="text-lg font-semibold">{scoreValue}</span>
            </div>
            <div>
              <div className="font-medium mb-2 text-lg">Analysis:</div>
              <div className="h-[300px] overflow-y-auto p-3 bg-white border rounded text-md whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {analysisText}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2 text-lg">Error:</div>
              <div className="h-[300px] overflow-y-auto p-3 bg-white border rounded text-md whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {props.error}
              </div>
            </div>
          </div>
        </div>
      </ArtifactContent>
    </div>
  );
}
