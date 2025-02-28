import { useState, useRef, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";
import { ProfileMenu } from "./ProfileMenu";

export function Chat({ inputRef }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat();
  const messagesEndRef = useRef(null);
  const defaultInputRef = useRef(null);
  const actualInputRef = inputRef || defaultInputRef;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechQueue = useRef([]);
  const currentUtterance = useRef(null);

  // Split text into smaller chunks
  const splitTextIntoChunks = (text) => {
    // Split on sentence endings (., !, ?) followed by a space or newline
    const sentences = text.match(/[^.!?]+[.!?]+[\s\n]*/g) || [text];
    const chunks = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
      // If adding this sentence would make the chunk too long, start a new chunk
      if ((currentChunk + sentence).length > 200) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    });
    
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  };

  // Process the speech queue
  const processSpeechQueue = () => {
    if (!window.speechSynthesis || !speechQueue.current.length || isSpeaking) return;

    const text = speechQueue.current[0];
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance.current = utterance;

    // Configure utterance
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Get available voices and select a good one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (voice.name.includes('Female') || voice.name.includes('Google'))
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      speechQueue.current.shift(); // Remove the spoken chunk
      currentUtterance.current = null;
      // Process next chunk if any
      setTimeout(processSpeechQueue, 100);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      speechQueue.current.shift();
      currentUtterance.current = null;
      setTimeout(processSpeechQueue, 100);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Initialize speech synthesis
  const speakMessage = (text) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    currentUtterance.current = null;
    
    // Split text into chunks and add to queue
    const chunks = splitTextIntoChunks(text);
    speechQueue.current = chunks;
    
    // Start processing the queue
    processSpeechQueue();
  };

  // Effect to handle voice selection
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechQueue.current = [];
        currentUtterance.current = null;
      }
    };
  }, []);

  // Effect to speak new AI messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !isLoading) {
      speakMessage(lastMessage.content);
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    actualInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Stop any ongoing speech when sending a new message
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechQueue.current = [];
        currentUtterance.current = null;
      }
      await sendMessage(input);
      setInput("");
    } finally {
      setTimeout(() => {
        actualInputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">LangGraph Chat</h1>
          <div className="flex items-center space-x-4">
            {isSpeaking && (
              <div className="flex items-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <ProfileMenu />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } animate-fade-in`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-500 text-white ml-4"
                    : "bg-white text-gray-800 mr-4"
                } ${
                  isLoading &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                    ? "animate-pulse"
                    : ""
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                ref={actualInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
