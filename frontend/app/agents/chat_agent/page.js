"use client";

import "./index.css";
import React from "react";
import { Chat } from "../../components/Chat";
import { ChatProvider } from "../../contexts/ChatContext";

export default function ChatPage() {
    return (
        <ChatProvider>
            <Chat />
        </ChatProvider>
    );
}
