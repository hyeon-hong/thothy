import React, { useEffect } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// TypeScript interfaces matching the Python classes from state.py
interface Section {
  name: string;
  description: string;
  research: boolean;
  content: string;
}

interface Sections {
  sections: Section[];
}

export default function ResearchGraphComponent(props: {
  content?: string;
  topic?: string;
  sections?: Sections;
}) {
  console.log("props: ", props);
  console.log("props.content: ", props.content);
  console.log("props.topic: ", props.topic);
  console.log("props.sections: ", props.sections);
  console.log("props.sections?.sections: ", props.sections?.sections);

  const { meta } = useStreamContext<
    { research_report?: { content: string } },
    { MetaType: { ui: any; artifact: any } }
  >();

  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  useEffect(() => {
    setOpen(true);
  }, [props.sections, props.content, props.topic]);

  // Get content from props or context, prioritizing props
  const reportContent = props.content || context.research_report?.content;

  // Helper function to safely get sections array
  const getSectionsArray = (): Section[] => {
    if (!props.sections) return [];
    
    // Check if sections is the expected Sections object with sections property
    if (props.sections.sections && Array.isArray(props.sections.sections)) {
      return props.sections.sections;
    }
    
    // Check if sections is directly an array (fallback case)
    if (Array.isArray(props.sections)) {
      return props.sections as Section[];
    }
    
    return [];
  };

  const sectionsArray = getSectionsArray();

  // Format the report content with proper markdown-like styling
  const formatReportContent = (content: string) => {
    if (!content) return "No report content available.";

    // Split content into sections and format
    const sections = content.split("\n\n");
    return sections
      .map((section, index) => {
        if (section.trim().startsWith("#")) {
          // This is a header
          const level = section.match(/^#+/)?.[0].length || 1;
          const text = section.replace(/^#+\s*/, "");
          const headerClass =
            level === 1
              ? "text-2xl font-bold mb-4"
              : level === 2
                ? "text-xl font-semibold mb-3"
                : "text-lg font-medium mb-2";
          return (
            <div key={index} className={headerClass}>
              {text}
            </div>
          );
        } else if (section.trim()) {
          // Regular paragraph content
          return (
            <div key={index} className="mb-4 text-gray-700 leading-relaxed">
              {section
                .trim()
                .split("\n")
                .map((line, lineIndex) => (
                  <p key={lineIndex} className="mb-2">
                    {line}
                  </p>
                ))}
            </div>
          );
        }
        return null;
      })
      .filter(Boolean);
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
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {/* Display topic if available */}
          {props.topic && (
            <Card>
              <CardHeader>
                <CardTitle>Research Topic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{props.topic}</p>
              </CardContent>
            </Card>
          )}

          {/* Display sections if available */}
          {sectionsArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Report Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectionsArray.map((section, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">
                          {section.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            section.research
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {section.research
                            ? "Research Required"
                            : "No Research"}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {section.description}
                      </p>
                      {section.content && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium mb-2">Content:</h4>
                          <div className="text-gray-700 leading-relaxed">
                            {section.content
                              .split("\n")
                              .map((line, lineIndex) => (
                                <p key={lineIndex} className="mb-1">
                                  {line}
                                </p>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display report content if available */}
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
              <p>
                No research report available yet. The report will appear here
                once generation is complete.
              </p>
            </div>
          )}
        </div>
      </ArtifactContent>
    </div>
  );
}
