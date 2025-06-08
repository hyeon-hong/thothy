import { useState, useCallback, useEffect, useRef } from "react";
import debounce from "lodash/debounce";
import { useAuth } from "../contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { logDeep } from "../utils/debugUtils";
import { createClient } from "@/utils/supabase/client";

const THREAD_ID_KEY = "latest_thread";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useThreadManager(userId, client, graph_name) {
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const { session } = useAuth();
    const [shouldFetchMessages, setShouldFetchMessages] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Create a ref to hold the debounced function
    const debouncedFetchThreadsRef = useRef(null);

    // Helper function to validate client session
    const validateClientSession = useCallback(async () => {
        if (!client || !userId) return false;

        try {
            // Try a simple operation to test client validity
            const response = await client.threads.search({ limit: 1 });
            return true;
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                console.log("Client session invalid, attempting to refresh...");

                // Use Supabase's built-in session refresh
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    // Update client headers with new session
                    client.defaultHeaders = {
                        ...client.defaultHeaders,
                        Authorization: `Bearer ${session.access_token}`,
                    };
                    return true;
                }
            }
            return false;
        }
    }, [client, userId]);

    // Enhanced withRetry to include session validation
    const withRetry = useCallback(
        async (operation, operationName) => {
            let attempts = 0;
            while (attempts < MAX_RETRIES) {
                try {
                    // Validate session before each attempt
                    const isValid = await validateClientSession();
                    if (!isValid) {
                        throw new Error("Failed to validate client session");
                    }
                    return await operation();
                } catch (error) {
                    attempts++;
                    if (
                        (error.status === 401 || error.status === 403) &&
                        attempts < MAX_RETRIES
                    ) {
                        console.log(
                            `${operationName} failed with auth error, retrying in ${RETRY_DELAY}ms... (Attempt ${attempts}/${MAX_RETRIES})`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, RETRY_DELAY)
                        );
                    } else {
                        throw error;
                    }
                }
            }
        },
        [validateClientSession]
    );

    // Debounced version of thread fetching with retry logic
    const fetchThreads = useCallback(
        async (retry = false) => {
            if (!userId || !client) return;

            setIsLoading(true);
            try {
                await validateClientSession();

                // Search criteria including user ID and assistant_id (graph_name)
                const searchCriteria = {
                    limit: 100,
                    metadata: {
                        assistant_id: graph_name,
                        user_id: userId,
                    },
                };

                // Add assistant_id filter if graph_name is provided
                if (graph_name) {
                    searchCriteria.assistant_id = graph_name;
                }

                const userThreads = await client.threads.search(searchCriteria);

                console.log("userThreads", userThreads);
                // Sort threads by creation time, newest first
                const sortedThreads = userThreads
                    .filter((thread) => thread?.metadata?.created_at)
                    .sort(
                        (a, b) =>
                            new Date(b.metadata.created_at) -
                            new Date(a.metadata.created_at)
                    );

                setThreads(sortedThreads);
                setRetryCount(0); // Reset retry count on success

                // Auto-select the first thread if no thread is currently selected
                if (sortedThreads.length > 0 && !currentThreadId) {
                    const firstThread = sortedThreads[0];
                    setCurrentThreadId(firstThread.thread_id);
                    localStorage.setItem(THREAD_ID_KEY, firstThread.thread_id);
                }

                // Mark initial load as complete
                setInitialLoadComplete(true);
            } catch (error) {
                console.error("Error fetching threads:", error);
                if (
                    (error.status === 401 || error.status === 403) &&
                    retry &&
                    retryCount < MAX_RETRIES
                ) {
                    console.log(
                        `Retrying fetch threads in ${RETRY_DELAY}ms... (Attempt ${
                            retryCount + 1
                        }/${MAX_RETRIES})`
                    );
                    setRetryCount((prev) => prev + 1);
                    // Use the ref to avoid circular dependency
                    setTimeout(() => {
                        if (debouncedFetchThreadsRef.current) {
                            debouncedFetchThreadsRef.current(true);
                        } else {
                            // Fallback if ref not set yet
                            fetchThreads(true);
                        }
                    }, RETRY_DELAY);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [
            userId,
            client,
            retryCount,
            currentThreadId,
            validateClientSession,
            setThreads,
            setCurrentThreadId,
            setInitialLoadComplete,
            setRetryCount,
            setIsLoading,
            graph_name,
        ]
    );

    // Create the debounced version of fetchThreads
    const debouncedFetchThreads = useCallback(
        debounce((retry = false) => fetchThreads(retry), 300),
        [fetchThreads]
    );

    // Update the ref whenever debouncedFetchThreads changes
    useEffect(() => {
        debouncedFetchThreadsRef.current = debouncedFetchThreads;
    }, [debouncedFetchThreads]);

    // New effect to handle initial message loading
    useEffect(() => {
        if (initialLoadComplete && currentThreadId && client) {
            setShouldFetchMessages(true);
        }
    }, [initialLoadComplete, currentThreadId, client]);

    // Effect to fetch messages when a thread is selected (either by user or auto-selection)
    useEffect(() => {
        const fetchMessages = async () => {
            if (!currentThreadId || !client || !shouldFetchMessages) return;

            try {
                await withRetry(async () => {
                    // Use the correct API endpoint structure
                    const response = await client.threads.get(currentThreadId);
                    const messages = response.messages || [];

                    // Emit a custom event that the Chat component can listen to
                    window.dispatchEvent(
                        new CustomEvent("threadMessagesLoaded", {
                            detail: { messages, threadId: currentThreadId },
                        })
                    );
                }, "Fetch messages");
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setShouldFetchMessages(false);
            }
        };

        fetchMessages();
    }, [currentThreadId, client, shouldFetchMessages, withRetry]);

    // Update the setCurrentThreadId function to trigger message fetch
    const setCurrentThreadIdWithMessages = useCallback((threadId) => {
        setCurrentThreadId(threadId);
        setShouldFetchMessages(true);
    }, []);

    // Load threads on mount and when userId or client changes
    useEffect(() => {
        if (client && userId) {
            debouncedFetchThreads(true); // Enable retry on initial load
            return () => debouncedFetchThreads.cancel();
        }
    }, [userId, client, debouncedFetchThreads]);

    const getThreadById = useCallback(
        async (threadId) => {
            if (
                !client ||
                !userId ||
                !threadId ||
                typeof threadId !== "string" ||
                !threadId.match(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                )
            ) {
                console.error(
                    "Invalid thread ID format or missing client or userId"
                );
                return null;
            }

            try {
                return await withRetry(
                    () => client.threads.get(threadId),
                    "Get thread"
                );
            } catch (error) {
                console.error("Error getting thread:", error);
                return null;
            }
        },
        [client, withRetry, userId]
    );

    const createNewThread = useCallback(async () => {
        console.log("Creating new thread");
        if (!client || !userId) return null;

        try {
            const thread = await withRetry(
                () =>
                    client.threads.create({
                        metadata: {
                            user_id: userId,
                            created_at: new Date().toISOString(),
                            title: "New Chat",
                            assistant_id: graph_name,
                        },
                    }),
                "Create thread"
            );
            console.log("Thread created:", thread);
            localStorage.setItem(THREAD_ID_KEY, thread.thread_id);

            setThreads((prev) => [
                {
                    ...thread,
                    title: "New Chat",
                },
                ...prev,
            ]);

            return thread;
        } catch (error) {
            console.error("Error creating thread:", error);
            return null;
        }
    }, [client, userId, withRetry, setThreads, graph_name]);

    // Initialize or restore current thread with retry logic
    useEffect(() => {
        if (!client || !userId) return;

        const initializeThread = async () => {
            try {
                if (currentThreadId) {
                    const thread = await getThreadById(currentThreadId);
                    if (thread) {
                        setShouldFetchMessages(true); // Trigger message fetch for existing thread
                        return;
                    }
                }

                const storedThreadId = localStorage.getItem(THREAD_ID_KEY);
                console.log("storedThreadId", storedThreadId);
                if (storedThreadId) {
                    try {
                        const thread = await getThreadById(storedThreadId);
                        if (thread) {
                            setCurrentThreadId(storedThreadId);
                            setShouldFetchMessages(true); // Trigger message fetch for restored thread
                            return;
                        }
                    } catch (error) {
                        if (error.status === 401) {
                            // If we get a 401, we'll retry the entire initialization
                            console.log(
                                "Auth error during thread initialization, will retry..."
                            );
                            return;
                        }
                        console.error("Error restoring thread:", error);

                        // If we get an error, remove the thread ID from local storage
                        localStorage.removeItem(THREAD_ID_KEY);
                    }
                }

                // If we have existing threads, use the most recent one
                if (threads.length > 0) {
                    setCurrentThreadId(threads[0].thread_id);
                    localStorage.setItem(THREAD_ID_KEY, threads[0].thread_id);
                    setShouldFetchMessages(true); // Trigger message fetch for first thread
                    return;
                }

                // Only create a new thread if we have no threads at all
                const newThread = await createNewThread();
                if (newThread) {
                    setCurrentThreadId(newThread.thread_id);
                    localStorage.setItem(THREAD_ID_KEY, newThread.thread_id);
                    setShouldFetchMessages(true); // Trigger message fetch for new thread
                }
            } catch (error) {
                if (error.status === 401 && retryCount < MAX_RETRIES) {
                    console.log(
                        `Retrying thread initialization in ${RETRY_DELAY}ms... (Attempt ${
                            retryCount + 1
                        }/${MAX_RETRIES})`
                    );
                    setTimeout(initializeThread, RETRY_DELAY);
                    setRetryCount((prev) => prev + 1);
                } else {
                    console.error(
                        "Failed to initialize thread after retries:",
                        error
                    );
                }
            }
        };

        initializeThread();
    }, [
        client,
        userId,
        currentThreadId,
        threads,
        retryCount,
        createNewThread,
        getThreadById,
        setCurrentThreadId,
        setShouldFetchMessages,
        setRetryCount,
    ]);

    const deleteThread = async (threadId) => {
        console.log("Deleting thread:", threadId);
        console.log("currentThreadId", currentThreadId);
        console.log("client", client);
        if (!client || !userId) return null;

        // Check if client has valid access token
        const hasValidToken =
            client?.defaultHeaders?.Authorization?.includes("Bearer") &&
            !client.defaultHeaders.Authorization.includes("undefined");

        if (!hasValidToken) {
            console.log(
                "No valid access token found, attempting to refresh session..."
            );

            // Use Supabase's built-in session refresh
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                client.defaultHeaders = {
                    ...client.defaultHeaders,
                    Authorization: `Bearer ${session.access_token}`,
                };
                console.log("Session refreshed successfully");
            } else {
                console.error("Failed to refresh session");
                return null;
            }
        }

        try {
            await withRetry(
                () => client.threads.delete(threadId),
                "Delete thread"
            );

            setThreads((prev) => {
                const updatedThreads = prev.filter(
                    (t) => t.thread_id !== threadId
                );
                console.log("updatedThreads", updatedThreads);

                if (threadId === currentThreadId) {
                    console.log("threadId === currentThreadId");
                    if (updatedThreads.length > 0) {
                        const nextThread = updatedThreads[0];
                        setCurrentThreadId(nextThread.thread_id);
                        localStorage.setItem(
                            THREAD_ID_KEY,
                            nextThread.thread_id
                        );
                    } else {
                        console.log(
                            "No threads remaining, creating new thread"
                        );
                        // If no threads remain, remove from local storage
                        localStorage.removeItem(THREAD_ID_KEY);
                    }
                } else if (localStorage.getItem(THREAD_ID_KEY) === threadId) {
                    console.log(
                        "Deleted thread is stored in localStorage but not current, removing it"
                    );
                    // If deleted thread is stored in localStorage but not current, remove it
                    localStorage.removeItem(THREAD_ID_KEY);
                }

                return updatedThreads;
            });
        } catch (error) {
            console.error("Error deleting thread:", error);
            await debouncedFetchThreads(true);
        }
    };

    const updateThreadMetadata = async (threadId, metadata) => {
        if (!client || !userId) return null;

        try {
            await withRetry(
                () =>
                    client.threads.update(threadId, {
                        metadata: {
                            ...metadata,
                            updated_at: new Date().toISOString(),
                        },
                    }),
                "Update thread metadata"
            );

            setThreads((prev) =>
                prev.map((thread) =>
                    thread.thread_id === threadId
                        ? {
                              ...thread,
                              metadata: {
                                  ...thread.metadata,
                                  ...metadata,
                                  updated_at: new Date().toISOString(),
                              },
                          }
                        : thread
                )
            );
        } catch (error) {
            console.error("Error updating thread metadata:", error);
        }
    };

    return {
        threads,
        currentThreadId,
        isLoading,
        createNewThread,
        deleteThread,
        updateThreadMetadata,
        setCurrentThreadId: setCurrentThreadIdWithMessages,
        refreshThreads: () => debouncedFetchThreads(true),
        setThreads,
    };
}
