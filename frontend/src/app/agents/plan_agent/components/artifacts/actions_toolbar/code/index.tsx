import { useEffect, useRef, useState } from "react";
import { cn } from "../../../../lib/utils";
import { PortToLanguageOptions } from "./PortToLanguage";
import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { GraphInput } from "@opencanvas/shared/types";

// Simple icon components to avoid type issues
const MessageCircleCodeIcon = () => <span>💬</span>;
const ScrollTextIcon = () => <span>📜</span>;
const BookAIcon = () => <span>📚</span>;
const BugIcon = () => <span>🐞</span>;
const CodeIcon = () => <span>📝</span>;

type SharedComponentProps = {
  handleClose: () => void;
  streamMessage: (params: GraphInput) => Promise<void>;
  language: ProgrammingLanguageOptions;
};

type ToolbarOption = {
  id: string;
  tooltip: string;
  icon: React.ReactNode;
  component: ((props: SharedComponentProps & { language?: ProgrammingLanguageOptions }) => React.ReactNode) | null;
};

export interface CodeToolbarProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  isTextSelected: boolean;
  language: ProgrammingLanguageOptions;
}

const toolbarOptions: ToolbarOption[] = [
  {
    id: "addComments",
    tooltip: "Add comments",
    icon: <MessageCircleCodeIcon />,
    component: null,
  },
  {
    id: "addLogs",
    tooltip: "Add logs",
    icon: <ScrollTextIcon />,
    component: null,
  },
  {
    id: "portLanguage",
    tooltip: "Port language",
    icon: <BookAIcon />,
    component: (
      props: SharedComponentProps & { language: ProgrammingLanguageOptions }
    ) => <PortToLanguageOptions {...props} />,
  },
  {
    id: "fixBugs",
    tooltip: "Fix bugs",
    icon: <BugIcon />,
    component: null,
  },
];

export function CodeToolBar(props: CodeToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        expanded
      ) {
        setExpanded(false);
        setActiveOption(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);

  const toggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded(!expanded);
    if (!expanded) {
      setActiveOption(null);
    }
  };

  const handleOptionClick = async (
    event: React.MouseEvent,
    optionId: string
  ) => {
    event.stopPropagation();
    event.preventDefault();

    const { streamMessage } = props;

    if (
      toolbarOptions.find((option) => option.id === optionId)?.component === null
    ) {
      setExpanded(false);
      setActiveOption(null);

      if (optionId === "addComments") {
        await streamMessage({
          addComments: true,
        });
      } else if (optionId === "addLogs") {
        await streamMessage({
          addLogs: true,
        });
      } else if (optionId === "fixBugs") {
        await streamMessage({
          fixBugs: true,
        });
      }
    } else {
      setActiveOption(optionId);
    }
  };

  const handleClose = () => {
    setExpanded(false);
    setActiveOption(null);
  };

  return (
    <div ref={ref} className="absolute top-0 right-0 z-10 p-2">
      {expanded ? (
        <div className="flex items-center gap-2 bg-white rounded-md p-2 shadow-md">
          {toolbarOptions.map((option) => (
            <div
              key={option.id}
              className="relative"
              onClick={(e) => handleOptionClick(e, option.id)}
            >
              <button
                title={option.tooltip}
                className={cn(
                  "p-2 rounded hover:bg-gray-100",
                  activeOption === option.id
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-400 hover:text-gray-900"
                )}
              >
                {option.icon}
              </button>

              {activeOption === option.id && option.component && (
                <div className="absolute top-full right-0 mt-2 w-60 p-4 bg-white rounded-md shadow-lg z-20">
                  {option.component({
                    handleClose,
                    streamMessage: props.streamMessage,
                    language: props.language,
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div onClick={toggleExpand}>
          <button
            title="Code actions"
            className="p-2 rounded hover:bg-gray-100"
          >
            <span className={cn(
              "inline-block text-center text-xl",
              props.isTextSelected
                ? "text-gray-400"
                : "hover:text-gray-900 transition-colors"
            )}>
              <CodeIcon />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
