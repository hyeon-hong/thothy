import React, { useEffect } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";

export default function ResearchGraphComponent(props: {
  content?: string;
}) {
  const { meta } = useStreamContext<
    { research_report?: { content: string } },
    { MetaType: { ui: any; artifact: any } }
  >();
  
  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  useEffect(() => {
    setOpen(true);
  }, [context, props.content]);

  // Get content from props or context, prioritizing props
  const reportContent = props.content || context.research_report?.content;

  // Format the report content with proper markdown-like styling
  const formatReportContent = (content: string) => {
    if (!content) return "No report content available.";
    
    // Split content into sections and format
    const sections = content.split('\n\n');
    return sections.map((section, index) => {
      if (section.trim().startsWith('#')) {
        // This is a header
        const level = section.match(/^#+/)?.[0].length || 1;
        const text = section.replace(/^#+\s*/, '');
        const headerClass = level === 1 ? 'text-2xl font-bold mb-4' : 
                           level === 2 ? 'text-xl font-semibold mb-3' : 
                           'text-lg font-medium mb-2';
        return (
          <div key={index} className={headerClass}>
            {text}
          </div>
        );
      } else if (section.trim()) {
        // Regular paragraph content
        return (
          <div key={index} className="mb-4 text-gray-700 leading-relaxed">
            {section.trim().split('\n').map((line, lineIndex) => (
              <p key={lineIndex} className="mb-2">{line}</p>
            ))}
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="h-full">
      <button
        className="mb-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? "Click to hide report" : "Click to display report"}
      </button>
      
      <ArtifactContent title={<div>Research Report</div>}>
        <div className="space-y-4">
          {reportContent ? (
            <Card>
              <CardHeader>
                <CardTitle>Generated Research Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {formatReportContent(reportContent)}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                Report generated at {new Date().toLocaleString()}
              </CardFooter>
            </Card>
          ) : (
            <div className="p-4 border rounded bg-gray-50">
              <p>No research report available yet. The report will appear here once generation is complete.</p>
            </div>
          )}
        </div>
      </ArtifactContent>
    </div>
  );
}
