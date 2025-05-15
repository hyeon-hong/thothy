import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

export default function DataGraphComponent() {
  const { meta } = useStreamContext<
    { prices: any },
    { MetaType: { ui: any; artifact: any } }
  >();
  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  console.log("context: ", context);

  return (
    <div className="bg-blue-500">
      <button
        className="mb-2 px-2 py-1 rounded bg-white text-black border border-gray-300 hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Show"}
      </button>
      <div>Artifact</div>
      <ArtifactContent title={<div>{context?.title}</div>}>
        {typeof context === "object" && context !== null ? (
          <pre>{JSON.stringify(context, null, 2)}</pre>
        ) : (
          context
        )}
      </ArtifactContent>
    </div>
  );
}
