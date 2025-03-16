"use client";

import "@/app/globals.css";
import React, { useEffect, useRef } from "react";
import { Chat } from "@/components/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

export default function ChatAgentPage() {
    const inputRef = useRef(null);
    const graph_name = "chat_graph"; // Default value or you could extract from URL if needed

    useEffect(() => {
        // Focus input when page mounts
        inputRef.current?.focus();

        const handleKeyPress = (e) => {
            // Check if the pressed key is "/" and no input/textarea is focused
            // Also don't handle key events if they occurred on navigation elements (buttons, links)
            const isNavElement = e.target.closest('button, a, [role="button"]');
            if (isNavElement) return;

            if (
                e.key === "/" &&
                !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
            ) {
                e.preventDefault(); // Prevent "/" from being typed
                inputRef.current?.focus();
            }
        };

        // Focus input when window gains focus but check if active element is not a navigation element
        const handleWindowFocus = () => {
            const isNavElement = document.activeElement?.closest(
                'button, a, [role="button"]'
            );
            if (!isNavElement) {
                inputRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    return (
        <ChatProvider graph_name={graph_name}>
            <Chat inputRef={inputRef} graph_name={graph_name} />
        </ChatProvider>
    );
}
