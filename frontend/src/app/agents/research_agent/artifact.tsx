import React, { useEffect, useState } from "react";
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
  section_update?: {
    name: string;
    content: string;
    status: string;
    iteration?: number;
  };
}) {
  const { meta } = useStreamContext<
    { research_report?: { content: string } },
    { MetaType: { ui: any; artifact: any } }
  >();

  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  // State to track completed sections
  const [completedSections, setCompletedSections] = useState<
    Map<string, string>
  >(new Map());
  const [sectionStatuses, setSectionStatuses] = useState<
    Map<string, { status: string; iteration?: number }>
  >(new Map());
  
  // State to track updated sections array
  const [updatedSections, setUpdatedSections] = useState<Section[]>([]);

  useEffect(() => {
    setOpen(true);
  }, [props.sections, props.content, props.topic, props.section_update]);

  // Initialize updated sections when props.sections changes
  useEffect(() => {
    const sectionsArray = getSectionsArray();
    if (sectionsArray.length > 0) {
      setUpdatedSections(sectionsArray);
    }
  }, [props.sections]);

  // Update sections array when section_update is received
  useEffect(() => {
    if (props.section_update) {
      setUpdatedSections((prevSections) => {
        return prevSections.map((section) => {
          if (section.name === props.section_update!.name) {
            return {
              ...section,
              content: props.section_update!.content || section.content,
            };
          }
          return section;
        });
      });

      setCompletedSections((prev) => {
        const updated = new Map(prev);
        updated.set(props.section_update!.name, props.section_update!.content);
        return updated;
      });

      setSectionStatuses((prev) => {
        const updated = new Map(prev);
        updated.set(props.section_update!.name, {
          status: props.section_update!.status,
          iteration: props.section_update!.iteration,
        });
        return updated;
      });
    }
  }, [props.section_update]);
  console.log("props.section_update: ", props.section_update);

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

      <ArtifactContent title={<div>{props.topic || "Research Report"}</div>}>
        <div
          className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
          style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
        >
          {/* Display sections if available */}
          {updatedSections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Report Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updatedSections.map((section, index) => {
                    const isCompleted = completedSections.has(section.name);
                    const completedContent = completedSections.get(
                      section.name
                    );
                    const sectionStatus = sectionStatuses.get(section.name);
                    const status = sectionStatus?.status || "pending";
                    const iteration = sectionStatus?.iteration;

                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          status === "completed"
                            ? "bg-green-50 border-green-200"
                            : status === "needs_more_research"
                              ? "bg-orange-50 border-orange-200"
                              : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {section.name}
                            {status === "completed" && (
                              <span className="text-green-600 text-sm">✓</span>
                            )}
                            {status === "needs_more_research" && (
                              <span className="text-orange-600 text-sm">
                                🔄
                              </span>
                            )}
                          </h3>
                          <div className="flex gap-2">
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
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : status === "needs_more_research"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {status === "completed"
                                ? "Completed"
                                : status === "needs_more_research"
                                  ? `Research in progress${iteration ? ` (${iteration})` : ""}`
                                  : "Pending"}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {section.description}
                        </p>
                        {(completedContent || section.content) && (
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-medium mb-2">Content:</h4>
                            <div className="text-gray-700 leading-relaxed">
                              {(completedContent || section.content)
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display report content if available */}
          {reportContent && (
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
          )}
        </div>
      </ArtifactContent>
    </div>
  );
}
