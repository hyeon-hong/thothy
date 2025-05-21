import React, { useEffect } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

export default function DataGraphComponent(props: { price_snapshot: string }) {
  const { meta } = useStreamContext<
    { price_snapshot: string },
    { MetaType: { ui: any; artifact: any } }
  >();
  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;
  console.log("props: ", props);
  console.log("context: ", context);
  console.log("props.price_snapshot: ", props.price_snapshot);

  useEffect(() => {
    setOpen(true);
  }, [context]);

  return (
    <div className="h-full">
      <button
        className="mb-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? "Click to hide data" : "Click to display data"}
      </button>
      <ArtifactContent title={<div>Data</div>}>
        <pre>{JSON.stringify(context.price_snapshot, null, 2)}</pre>
      </ArtifactContent>
    </div>
  );
}
