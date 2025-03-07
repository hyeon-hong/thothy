"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "../contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";

// Constants for layout calculations
const HEADER_HEIGHT = 64; // MUI AppBar default height
const INPUT_HEIGHT = 88; // Input area height including padding

export function Chat({ inputRef }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, currentThreadId } = useChat();
  const messagesEndRef = useRef(null);
  const defaultInputRef = useRef(null);
  const actualInputRef = inputRef || defaultInputRef;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const speechQueue = useRef([]);
  const currentUtterance = useRef(null);
  const nextUtterance = useRef(null);
  const voicesLoaded = useRef(false);
  const OVERLAP_TIME = 100;
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Use messages directly from context
  const allMessages = messages;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Split text into smaller, more manageable chunks
  const splitTextIntoChunks = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    let currentLength = 0;
    const CHUNK_SIZE = 150; // Slightly smaller chunks for better overlap
    
    sentences.forEach((sentence) => {
      if (currentLength + sentence.length > CHUNK_SIZE && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentLength = 0;
      }
      currentChunk += sentence;
      currentLength += sentence.length;
    });
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  };

  // Initialize speech synthesis and load voices
  const initSpeechSynthesis = useCallback(async () => {
    if (!window.speechSynthesis) {
      return false;
    }

    // Wait for voices to load
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded.current = true;
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    return false;
  }, []);

  // Prepare utterance object with retry mechanism
  const createUtterance = useCallback((text, isNext = false) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (voice.name.includes('Female') || voice.name.includes('Google'))
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      return utterance;
    } catch (error) {
      return null;
    }
  }, []);

  // Helper function to highlight current chunk
  const renderMessageContent = (content, isCurrentMessage) => {
    if (!isCurrentMessage || !isSpeaking) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Get the current chunk being spoken
    const currentChunk = speechQueue.current[0] || '';
    
    // Find the position of the current chunk in the full content
    const chunkStart = content.indexOf(currentChunk);
    
    if (chunkStart === -1) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
    
    const beforeChunk = content.substring(0, chunkStart);
    const afterChunk = content.substring(chunkStart + currentChunk.length);
    
    return (
      <div className="whitespace-pre-wrap">
        {beforeChunk}
        <span className="bg-yellow-200 rounded px-1 transition-colors duration-300">
          {currentChunk}
        </span>
        {afterChunk}
      </div>
    );
  };

  // Process the speech queue with better error handling
  const processSpeechQueue = useCallback(async () => {
    if (!window.speechSynthesis || !speechQueue.current.length) {
      return;
    }

    // Ensure voices are loaded
    if (!voicesLoaded.current) {
      const initialized = await initSpeechSynthesis();
      if (!initialized) {
        return;
      }
    }

    // Make sure any previous speech is stopped
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const text = speechQueue.current[0];
    const utterance = createUtterance(text);
    
    if (!utterance) {
      speechQueue.current.shift();
      setTimeout(processSpeechQueue, 100);
      return;
    }

    currentUtterance.current = utterance;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtterance.current = null;
      
      // Remove the current chunk and process the next one
      if (speechQueue.current.length > 0) {
        speechQueue.current.shift();
        // Small delay to ensure proper transition
        setTimeout(() => {
          processSpeechQueue();
        }, 50);
      } else {
        // Reset speaking message ID when all speech is finished
        setSpeakingMessageId(null);
      }
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      currentUtterance.current = null;
      // Reset speaking message ID on error
      setSpeakingMessageId(null);
      
      // Try to recover from error
      if (speechQueue.current.length > 0) {
        speechQueue.current.shift();
        setTimeout(processSpeechQueue, 100);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setIsSpeaking(false);
      currentUtterance.current = null;
      setTimeout(processSpeechQueue, 100);
    }
  }, [initSpeechSynthesis, setIsSpeaking, createUtterance]);

  // Initialize speech synthesis with better error handling
  const speakMessage = useCallback(async (text, messageIndex) => {
    if (!window.speechSynthesis) {
      return;
    }
    
    try {
      // Ensure voices are loaded before starting
      if (!voicesLoaded.current) {
        const initialized = await initSpeechSynthesis();
        if (!initialized) {
          return;
        }
      }

      // Cancel any ongoing speech and reset state
      window.speechSynthesis.cancel();
      currentUtterance.current = null;
      setIsSpeaking(false);
      setCurrentMessageIndex(messageIndex);
      setCurrentWordIndex(-1);
      
      const chunks = splitTextIntoChunks(text);
      speechQueue.current = chunks;
      
      // Small delay before starting to ensure clean state
      setTimeout(() => {
        processSpeechQueue();
      }, 50);
    } catch (error) {
      setIsSpeaking(false);
    }
  }, [initSpeechSynthesis, processSpeechQueue, setCurrentMessageIndex, setCurrentWordIndex, setIsSpeaking]);

  // Effect to handle voice selection with retry
  useEffect(() => {
    let mounted = true;

    const initVoices = async () => {
      try {
        if (mounted && window.speechSynthesis) {
          const initialized = await initSpeechSynthesis();
          if (initialized) {
            window.speechSynthesis.onvoiceschanged = () => {
              if (mounted) {
                voicesLoaded.current = true;
              }
            };
          }
        }
      } catch (error) {
      }
    };

    initVoices();

    return () => {
      mounted = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechQueue.current = [];
        currentUtterance.current = null;
        nextUtterance.current = null;
        // Reset speaking state when unmounting
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    };
  }, [initSpeechSynthesis]);

  // Effect to speak new AI messages - REMOVING AUTO-SPEAKING
  useEffect(() => {
    // No longer auto-speaking new messages
    // Instead, the user will click the speaker icon to play
  }, [messages, isLoading, speakMessage]);

  const handleSpeakerClick = (message, index) => {
    if (isSpeaking && speakingMessageId === index) {
      // Stop speaking if this message is currently being spoken
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechQueue.current = [];
        currentUtterance.current = null;
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    } else {
      // Start speaking this message
      setSpeakingMessageId(index);
      speakMessage(message.content, index);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Focus input on component mount
  useEffect(() => {
    actualInputRef.current?.focus();
  }, [actualInputRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Save input before clearing it
    const messageText = input;
    
    // Clear input immediately for better UX
    setInput("");

    try {
      // Stop any ongoing speech when sending a new message
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechQueue.current = [];
        currentUtterance.current = null;
      }
      
      // Call sendMessage with the input
      sendMessage(currentThreadId, {
        text: messageText,
        role: "user"
      });
      
    } finally {
      // Focus the input field again
      setTimeout(() => {
        actualInputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Chat header */}
          <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
            {isSpeaking && (
              <div className="flex items-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-[2px] bg-gray-300" />

          {/* Messages area - fills remaining space */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: `${INPUT_HEIGHT + 16}px` }}>
            {allMessages.map((message, index) => (
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
                      : message.isError 
                        ? "bg-red-50 text-red-700 border border-red-300 mr-4"
                        : "bg-white text-gray-800 mr-4"
                  } ${
                    (message.isPartial || (isLoading && index === allMessages.length - 1 && message.role === "assistant"))
                      ? "border-l-4 border-green-500"
                      : ""
                  } ${
                    message.role === "assistant" ? "relative" : ""
                  }`}
                >
                  {message.content ? renderMessageContent(message.content, index === currentMessageIndex) : ""}
                  
                  {/* Typing indicator for streaming messages */}
                  {message.isPartial && (
                    <div className="flex mt-2 space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  )}
                  
                  {/* Speaker icon for assistant messages */}
                  {message.role === "assistant" && !message.isPartial && message.content && (
                    <button 
                      onClick={() => handleSpeakerClick(message, index)}
                      className="absolute bottom-2 right-2 p-1 text-gray-500 hover:text-blue-500 transition-colors focus:outline-none"
                      aria-label={isSpeaking && speakingMessageId === index ? "Stop speaking" : "Speak message"}
                    >
                      {isSpeaking && speakingMessageId === index ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area - fixed to main chat area */}
          <div className="absolute bottom-0 left-0 right-0 border-t bg-white" style={{ height: INPUT_HEIGHT }}>
            <form onSubmit={handleSubmit} className="flex w-full h-full p-4">
              <div className="flex flex-1 gap-4">
                <input
                  ref={actualInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
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
    </div>
  );
}
