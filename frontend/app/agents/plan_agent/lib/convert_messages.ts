import { BaseMessage, HumanMessage } from "@langchain/core/messages";

/**
 * Converts a LangChain message to OpenAI format
 */
export function convertToOpenAIFormat(message: HumanMessage) {
  return {
    role: "user",
    content: message.content,
    id: message.id,
  };
}

/**
 * Converts a single LangChain message to a format suitable for display
 */
export function convertLangchainMessages(message: BaseMessage) {
  // Map LangChain message types to expected role types
  let role: "user" | "system" | "assistant";
  const type = message._getType();
  
  if (type === "human") {
    role = "user";
  } else if (type === "system") {
    role = "system";
  } else {
    role = "assistant";
  }
  
  // Format content as expected by the assistant-ui library
  let formattedContent;
  if (typeof message.content === 'string') {
    formattedContent = [{ type: 'text', text: message.content }];
  } else {
    // Handle complex content types if needed
    formattedContent = [{ type: 'text', text: JSON.stringify(message.content) }];
  }
  
  return {
    role,
    content: formattedContent,
    id: message.id,
  };
} 