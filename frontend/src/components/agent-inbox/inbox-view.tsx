import { useThreadsContext } from "@/components/agent-inbox/contexts/ThreadContext";
import { InboxItem } from "./components/inbox-item";
import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, LIMIT_PARAM, OFFSET_PARAM } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { Pagination } from "./components/pagination";
import { Inbox as InboxIcon, LoaderCircle } from "lucide-react";
import { InboxButtons } from "./components/inbox-buttons";

function ThreadListSkeleton() {
  return (
    <div className="flex flex-col w-full gap-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col gap-2 p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentInboxView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const { loading, threadData } = useThreadsContext<ThreadValues>();
  const selectedInbox = (getSearchParam(INBOX_PARAM) ||
    "interrupted") as ThreadStatusWithAll;

  const changeInbox = async (inbox: ThreadStatusWithAll) => {
    updateQueryParams(
      [INBOX_PARAM, OFFSET_PARAM, LIMIT_PARAM],
      [inbox, "0", "10"]
    );
  };

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const offsetQueryParam = getSearchParam(OFFSET_PARAM);
      const limitQueryParam = getSearchParam(LIMIT_PARAM);
      if (!offsetQueryParam) {
        updateQueryParams(OFFSET_PARAM, "0");
      }
      if (!limitQueryParam) {
        updateQueryParams(LIMIT_PARAM, "10");
      }
    } catch (e) {
      console.error("Error updating query params", e);
    }
  }, [searchParams]);

  const threadDataToRender = React.useMemo(() => {
    const filteredThreadData = threadData.filter((t) => {
      if (selectedInbox === "all") return true;
      return t.status === selectedInbox;
    });
    return filteredThreadData;
  }, [selectedInbox, threadData]);
  const noThreadsFound = !threadDataToRender.length;

  return (
    <div className="relative w-full h-full">
      {/* Container with horizontal scroll */}
      <div className="w-full h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Minimum width container to ensure content doesn't get too squeezed */}
        <div className="min-w-[800px] h-full">
          {/* Maximum width container for large screens */}
          <div className="max-w-[2000px] mx-auto h-full">
            <div className="sticky top-0 bg-white z-10 px-4 sm:px-5 pt-4">
              <InboxButtons changeInbox={changeInbox} />
            </div>
            
            <div className="flex flex-col w-full h-[calc(100vh-200px)] border-y-[1px] border-gray-50 mt-3">
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loading ? (
                  <ThreadListSkeleton />
                ) : (
                  <>
                    {threadDataToRender.map((threadData, idx) => {
                      return (
                        <InboxItem<ThreadValues>
                          key={`inbox-item-${threadData.thread.thread_id}`}
                          threadData={threadData}
                          isLast={idx === threadDataToRender.length - 1}
                        />
                      );
                    })}
                    {noThreadsFound && (
                      <div className="w-full flex items-center justify-center p-4">
                        <div className="flex gap-2 items-center justify-center text-gray-700">
                          <InboxIcon className="w-6 h-6" />
                          <p className="font-medium">No threads found</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="sticky bottom-0 bg-white border-t border-gray-50 px-4 sm:px-5 py-4">
                <Pagination />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
