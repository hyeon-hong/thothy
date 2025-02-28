import { useState, useRef, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";
import Header from "./Header";

export function Chat({ inputRef, currentView, onViewChange }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat();
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
  const initSpeechSynthesis = async () => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Wait for voices to load
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded.current = true;
        console.log('Voices loaded:', voices.length);
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.error('Failed to load voices after', maxAttempts, 'attempts');
    return false;
  };

  // Prepare utterance object with retry mechanism
  const createUtterance = (text, isNext = false) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (voice.name.includes('Female') || voice.name.includes('Google'))
      ) || voices[0];
      
      if (preferredVoice) {
        console.log('Selected voice:', preferredVoice.name);
        utterance.voice = preferredVoice;
      } else {
        console.warn('No preferred voice found');
      }

      return utterance;
    } catch (error) {
      console.error('Error creating utterance:', error);
      return null;
    }
  };

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
  const processSpeechQueue = async () => {
    if (!window.speechSynthesis || !speechQueue.current.length) {
      console.log('Speech queue stopped:', { 
        synthAvailable: !!window.speechSynthesis,
        queueLength: speechQueue.current.length
      });
      return;
    }

    // Ensure voices are loaded
    if (!voicesLoaded.current) {
      const initialized = await initSpeechSynthesis();
      if (!initialized) {
        console.error('Failed to initialize speech synthesis');
        return;
      }
    }

    // Make sure any previous speech is stopped
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const text = speechQueue.current[0];
    const utterance = createUtterance(text);
    
    if (!utterance) {
      console.error('Failed to create utterance, skipping chunk');
      speechQueue.current.shift();
      setTimeout(processSpeechQueue, 100);
      return;
    }

    currentUtterance.current = utterance;

    utterance.onstart = () => {
      console.log('Started speaking chunk:', text);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Finished speaking chunk:', text);
      setIsSpeaking(false);
      currentUtterance.current = null;
      
      // Remove the current chunk and process the next one
      if (speechQueue.current.length > 0) {
        speechQueue.current.shift();
        // Small delay to ensure proper transition
        setTimeout(() => {
          processSpeechQueue();
        }, 50);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      currentUtterance.current = null;
      
      // Try to recover from error
      if (speechQueue.current.length > 0) {
        speechQueue.current.shift();
        setTimeout(processSpeechQueue, 100);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis speak error:', error);
      setIsSpeaking(false);
      currentUtterance.current = null;
      setTimeout(processSpeechQueue, 100);
    }
  };

  // Initialize speech synthesis with better error handling
  const speakMessage = async (text, messageIndex) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    try {
      // Ensure voices are loaded before starting
      if (!voicesLoaded.current) {
        const initialized = await initSpeechSynthesis();
        if (!initialized) {
          console.error('Failed to initialize speech synthesis');
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
      console.log('Created chunks:', chunks.length, chunks);
      speechQueue.current = chunks;
      
      // Small delay before starting to ensure clean state
      setTimeout(() => {
        processSpeechQueue();
      }, 50);
    } catch (error) {
      console.error('Speech synthesis initialization error:', error);
      setIsSpeaking(false);
    }
  };

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
                console.log('Voices changed, reloaded voices');
              }
            };
          }
        }
      } catch (error) {
        console.error('Error initializing voices:', error);
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
      }
    };
  }, []);

  // Effect to speak new AI messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !isLoading) {
      speakMessage(lastMessage.content, messages.length - 1);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 shadow-sm">
        <Header currentView={currentView} onViewChange={onViewChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat header */}
          <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
            {isSpeaking && (
              <div className="flex items-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </div>
            )}
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
                  {renderMessageContent(message.content, index === currentMessageIndex)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex w-full max-w-6xl mx-auto">
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
