import { useState, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";
import { useAuth } from "../contexts/AuthContext";

const THREAD_ID_KEY = "langgraph_thread_id";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useThreadManager(userId, client) {
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const { refreshSession } = useAuth();
    console.log("userId", userId);
    console.log("client", client);

    // Helper function to validate client session
    const validateClientSession = async () => {
        if (!client) return false;
        
        try {
            // Try a simple operation to test client validity
            await client.threads.search({ limit: 1 });
            return true;
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                console.log("Client session invalid, attempting to refresh...");
                const newSession = await refreshSession();
                if (newSession) {
                    // Update client headers with new session
                    client.defaultHeaders = {
                        ...client.defaultHeaders,
                        Authorization: `Bearer ${newSession.access_token}`,
                    };
                    return true;
                }
            }
            return false;
        }
    };

    // Enhanced withRetry to include session validation
    const withRetry = async (operation, operationName) => {
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
                if ((error.status === 401 || error.status === 403) && attempts < MAX_RETRIES) {
                    console.log(
                        `${operationName} failed with auth error, retrying in ${RETRY_DELAY}ms... (Attempt ${attempts}/${MAX_RETRIES})`
                    );
                    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
                } else {
                    throw error;
                }
            }
        }
    };

    // Debounced version of thread fetching with retry logic
    const debouncedFetchThreads = useCallback(
        debounce(async (retry = false) => {
            if (!userId || !client) return;

            setIsLoading(true);
            try {
                await validateClientSession();
                const userThreads = await client.threads.search({
                    limit: 100,
                });
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
            } catch (error) {
                console.error("Error fetching threads:", error);
                if ((error.status === 401 || error.status === 403) && retry && retryCount < MAX_RETRIES) {
                    console.log(
                        `Retrying fetch threads in ${RETRY_DELAY}ms... (Attempt ${
                            retryCount + 1
                        }/${MAX_RETRIES})`
                    );
                    setRetryCount((prev) => prev + 1);
                    setTimeout(() => debouncedFetchThreads(true), RETRY_DELAY);
                }
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [userId, client, retryCount, refreshSession]
    );

    // Load threads on mount and when userId or client changes
    useEffect(() => {
        if (client) {
            debouncedFetchThreads(true); // Enable retry on initial load
            return () => debouncedFetchThreads.cancel();
        }
    }, [userId, client]);

    const getThreadById = async (threadId) => {
        if (
            !client ||
            !threadId ||
            typeof threadId !== "string" ||
            !threadId.match(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            )
        ) {
            console.error("Invalid thread ID format or missing client");
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
    };

    // Initialize or restore current thread with retry logic
    useEffect(() => {
        if (!client) return;

        const initializeThread = async () => {
            try {
                if (currentThreadId) {
                    const thread = await getThreadById(currentThreadId);
                    if (thread) return;
                }

                const storedThreadId = localStorage.getItem(THREAD_ID_KEY);
                if (storedThreadId) {
                    try {
                        const thread = await getThreadById(storedThreadId);
                        if (thread) {
                            setCurrentThreadId(storedThreadId);
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
                    }
                }

                // If we have existing threads, use the most recent one
                if (threads.length > 0) {
                    setCurrentThreadId(threads[0].thread_id);
                    localStorage.setItem(THREAD_ID_KEY, threads[0].thread_id);
                    return;
                }

                // Only create a new thread if we have no threads at all
                const newThread = await createNewThread();
                if (newThread) {
                    setCurrentThreadId(newThread.thread_id);
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
    }, [client, currentThreadId, threads, retryCount]);

    const createNewThread = async () => {
        if (!client) return null;

        try {
            const thread = await withRetry(
                () =>
                    client.threads.create({
                        metadata: {
                            user_id: userId,
                            created_at: new Date().toISOString(),
                            title: "New Chat",
                        },
                    }),
                "Create thread"
            );

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
    };

    const deleteThread = async (threadId) => {
        console.log("Deleting thread:", threadId);
        console.log("currentThreadId", currentThreadId);
        console.log("client", client);
        if (!client) return;

        // Check if client has valid access token
        const hasValidToken = client?.defaultHeaders?.Authorization?.includes('Bearer') && 
            !client.defaultHeaders.Authorization.includes('undefined');
            
        if (!hasValidToken) {
            console.log("No valid access token found, attempting to refresh session...");
            const newSession = await refreshSession();
            if (newSession?.access_token) {
                client.defaultHeaders = {
                    ...client.defaultHeaders,
                    Authorization: `Bearer ${newSession.access_token}`,
                };
                console.log("Session refreshed successfully");
            } else {
                console.error("Failed to refresh session");
                return;
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
        if (!client) return;

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
        setCurrentThreadId,
        refreshThreads: () => debouncedFetchThreads(true),
        setThreads,
    };
}
