import { convertLangChainMessages } from "@assistant-ui/react-langgraph";

// Adapter to convert LangGraph stream chunks to Assistant UI compatible format
export class LangGraphStreamAdapter {
  private messages: any[] = [];
  private runId: string | null = null;
  private threadId: string | null = null;
  private isComplete: boolean = false;
  private lastUpdateTime: number = Date.now();

  constructor() {
    this.reset();
  }

  reset() {
    this.messages = [];
    this.runId = null;
    this.threadId = null;
    this.isComplete = false;
    this.lastUpdateTime = Date.now();
  }

  async processStream(stream: AsyncIterable<any>): Promise<any[]> {
    console.log("LangGraphStreamAdapter processing stream");
    
    try {
      // Iterate through the stream chunks
      for await (const chunk of stream) {
        console.log("Stream chunk:", chunk);
        this.lastUpdateTime = Date.now();
        
        // Extract metadata if available
        if (chunk.run_id && !this.runId) {
          this.runId = chunk.run_id;
          console.log("Run ID set:", this.runId);
        }
        
        if (chunk.thread_id && !this.threadId) {
          this.threadId = chunk.thread_id;
          console.log("Thread ID set:", this.threadId);
        }
        
        // If the chunk has data and event is messages/partial
        if (chunk.event === "messages/partial" && chunk.data) {
          console.log("Processing messages/partial chunk");
          // Extract the Assistant message from the data
          this.processPartialMessages(chunk.data);
        }
        
        // If the run is complete
        if (chunk.event === "run/completed") {
          console.log("Run completed");
          this.isComplete = true;
        }
      }
      
      console.log("Stream processing complete");
      
      // If no messages were collected but the stream completed, create an empty message
      if (this.messages.length === 0 && this.isComplete) {
        console.log("No messages collected, creating fallback message");
        this.messages.push({
          type: "assistant",
          content: "No response was generated.",
          id: `fallback-${Date.now()}`,
        });
      }
      
      console.log("Final processed messages:", this.messages);
      return this.messages;
    } catch (error) {
      console.error("Error processing LangGraph stream:", error);
      throw error;
    }
  }
  
  private processPartialMessages(data: any) {
    if (!data || !Array.isArray(data)) {
      console.warn("Invalid partial message data:", data);
      return;
    }
    
    // Find assistant messages in the array
    const assistantMessages = data.filter(msg => 
      msg.type === "ai" || msg.type === "assistant" || msg.role === "assistant"
    );
    
    if (assistantMessages.length === 0) {
      console.log("No assistant messages found in data");
      return;
    }
    
    // Process each assistant message
    for (const msg of assistantMessages) {
      console.log("Converting message:", msg);
      
      try {
        // Try to use the convertLangChainMessages utility
        const converted = convertLangChainMessages(msg);
        console.log("Converted message:", converted);
        
        // Check if this is a new message or update to existing
        const existingIndex = this.messages.findIndex(m => m.id === converted.id);
        
        if (existingIndex >= 0) {
          // Update existing message
          this.messages[existingIndex] = converted;
          console.log("Updated existing message at index:", existingIndex);
        } else {
          // Add as new message
          this.messages.push(converted);
          console.log("Added new message, total count:", this.messages.length);
        }
      } catch (error) {
        console.error("Error converting message:", error);
        
        // Fallback to manual conversion
        const fallbackMessage = {
          type: "assistant",
          content: typeof msg.content === 'string' ? msg.content : 
                  Array.isArray(msg.content) ? msg.content.map(c => c.text || '').join('\n') : 
                  JSON.stringify(msg.content),
          id: msg.id || `generated-${Date.now()}`,
        };
        
        console.log("Using fallback conversion:", fallbackMessage);
        this.messages.push(fallbackMessage);
      }
    }
  }
} 