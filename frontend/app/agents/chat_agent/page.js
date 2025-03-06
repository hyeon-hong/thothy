"use client";

import "./index.css";
import React, { useEffect, useRef } from "react";
import { Chat } from "../../components/Chat";
import { ChatProvider } from "../../contexts/ChatContext";

export default function ChatAgentPage() {
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus input when page mounts
        inputRef.current?.focus();

        const handleKeyPress = (e) => {
            // Check if the pressed key is "/" and no input/textarea is focused
            if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
                e.preventDefault(); // Prevent "/" from being typed
                inputRef.current?.focus();
            }
        };

        // Focus input when window gains focus
        const handleWindowFocus = () => {
            inputRef.current?.focus();
        };

        document.addEventListener("keydown", handleKeyPress);
        window.addEventListener("focus", handleWindowFocus);
        
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    return (
        <ChatProvider>
            <Chat inputRef={inputRef} />
        </ChatProvider>
    );
}
