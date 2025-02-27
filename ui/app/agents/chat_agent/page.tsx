"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useState } from "react";

export default function ChatAgentPage() {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("16px");

  // Render a greeting in the chat
  useCopilotAction({
    name: "greetUser",
    available: "remote",
    parameters: [
      {
        name: "name",
        description: "The name of the user to greet.",
        type: "string",
        required: true,
      },
    ],
    render: ({ args }) => {
      return (
        <div className="text-lg font-bold bg-blue-500 text-white p-4 rounded-xl text-center shadow-lg">
          Hello, {args.name}! Welcome to the Chat Agent.
        </div>
      );
    },
  });

  // Action for setting the background color
  useCopilotAction({
    name: "setBackgroundColor",
    available: "remote",
    parameters: [
      {
        name: "backgroundColor",
        description: "The background color to set. Make sure to pick nice colors.",
        type: "string",
        required: true,
      },
    ],
    handler({ backgroundColor }) {
      setBackgroundColor(backgroundColor);
    },
  });

  // Action for changing theme
  useCopilotAction({
    name: "setTheme",
    available: "remote",
    parameters: [
      {
        name: "theme",
        description: "The theme to set (light or dark).",
        type: "string",
        required: true,
      },
    ],
    handler({ theme }) {
      setTheme(theme);
      setBackgroundColor(theme === "dark" ? "#1a1a1a" : "#ffffff");
    },
  });

  // Action for changing font size
  useCopilotAction({
    name: "setFontSize",
    available: "remote",
    parameters: [
      {
        name: "size",
        description: "The font size to set (e.g., '14px', '16px', '18px').",
        type: "string",
        required: true,
      },
    ],
    handler({ size }) {
      setFontSize(size);
    },
  });

  return (
    <main
      style={{ backgroundColor }}
      className={`min-h-screen w-full transition-colors duration-300 ${
        theme === "dark" ? "text-white" : "text-gray-800"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 rounded-2xl shadow-2xl mb-8">
            <h1 
              className="text-4xl font-bold text-white text-center mb-4"
              style={{ fontSize }}
            >
              Chat Agent Interface
            </h1>
            <p className="text-white text-center text-lg opacity-90">
              Your AI-powered assistant is ready to help. Try asking me to:
            </p>
            <ul className="mt-4 text-white text-center space-y-2">
              <li>• Change the theme (light/dark)</li>
              <li>• Adjust the background color</li>
              <li>• Modify the font size</li>
              <li>• Greet you by name</li>
            </ul>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <p className="text-center" style={{ fontSize }}>
              Start a conversation with the AI assistant using the chat panel on the right →
            </p>
          </div>
        </div>
      </div>

      <CopilotChat
        defaultOpen={true}
        labels={{
          title: "AI Assistant",
          initial: "Hi! I'm your AI assistant. I can help you customize the page and interact with various features. Try asking me to change the theme, adjust colors, or greet you!",
        }}
      />
    </main>
  );
} 