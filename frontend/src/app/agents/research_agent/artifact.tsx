import React, { useEffect, useState, useRef } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Markdown from "react-markdown";

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
    research: boolean;
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

  // State to persistently store sections so they don't get lost when props.sections becomes undefined
  const persistentSectionsRef = useRef<Section[]>([]);

  useEffect(() => {
    setOpen(true);
  }, [props.sections, props.content, props.topic, props.section_update]);

  // Initialize updated sections when props.sections changes
  useEffect(() => {
    const sectionsArray = getSectionsArray();
    if (sectionsArray.length > 0) {
      persistentSectionsRef.current = sectionsArray;
    }
  }, [props.sections]);

  // Update section content when section_update is received
  useEffect(() => {
    if (props.section_update) {
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

      // Update research and status in persistentSectionsRef
      persistentSectionsRef.current = persistentSectionsRef.current.map(
        (section) => {
          if (section.name === props.section_update!.name) {
            return {
              ...section,
              content: props.section_update!.content,
              research: props.section_update!.research,
              status: props.section_update!.status,
              iteration: props.section_update!.iteration,
            };
          }
          return section;
        }
      );
    }
  }, [props.section_update]);

  // Track persistentSections changes
  useEffect(() => {
  }, [persistentSectionsRef.current]);

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

  // Compute sections with updated content
  const sectionsToRender = persistentSectionsRef.current.map((section) => ({
    ...section,
    content: completedSections.get(section.name) || section.content,
  }));

  // Format the report content with proper markdown-like styling
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
          {sectionsToRender.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Report Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectionsToRender.map((section, index) => {
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
                              : status === "processing"
                                ? "bg-blue-50 border-blue-200"
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
                            {status === "processing" && (
                              <span className="text-blue-600 text-sm">⏳</span>
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
                                : "Research Done"}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : status === "needs_more_research"
                                    ? "bg-orange-100 text-orange-800"
                                    : status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {status === "completed"
                                ? "Completed"
                                : status === "needs_more_research"
                                  ? `Research in progress${iteration ? ` (${iteration})` : ""}`
                                  : status === "processing"
                                    ? "Processing"
                                    : "Pending"}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {section.description}
                        </p>

                        {section.content && (
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-medium mb-2">Content:</h4>
                            <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                              <Markdown>{section.content}</Markdown>
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
                  <Markdown>{reportContent}</Markdown>
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
