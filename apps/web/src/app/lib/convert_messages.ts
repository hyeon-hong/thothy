import { HumanMessage } from "@langchain/core/messages";

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