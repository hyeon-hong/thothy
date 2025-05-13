import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

export default function UIGraphComponent(props: { code: string }) {
  const { meta } = useStreamContext<
    { code: string },
    { MetaType: { ui: any; artifact: any } }
  >();
  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  return (
    <div className="bg-red-500">
      <button
        className="mb-2 px-2 py-1 rounded bg-white text-black border border-gray-300 hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Show"}
      </button>
      <div>Code</div>
      <ArtifactContent title={<div>{context.title}</div>}>
        {context.code}
      </ArtifactContent>
    </div>
  );
}
