export const mockResearchAgentResponses = {
  // Mock streaming response for research agent
  streamingResponse: `event: metadata
data: {"run_id": "test-run-123", "thread_id": "test-thread-123"}

event: data
data: {"content": "I'll help you research that topic. Let me start by analyzing the request and creating a research plan.", "type": "message", "role": "assistant"}

event: data
data: {"topic": "AI Research Report", "sections": {"sections": [{"name": "Introduction", "description": "Overview of current AI landscape", "research": false, "content": ""}, {"name": "Machine Learning Advances", "description": "Recent developments in ML", "research": true, "content": ""}, {"name": "Applications", "description": "Real-world AI applications", "research": true, "content": ""}]}, "type": "artifact"}

event: data
data: {"section_update": {"name": "Introduction", "content": "Artificial Intelligence has experienced unprecedented growth in recent years, with significant breakthroughs across multiple domains...", "status": "completed", "research": false}, "type": "section_update"}

event: data
data: {"section_update": {"name": "Machine Learning Advances", "content": "Recent developments in machine learning include:\n\n1. **Large Language Models**: The emergence of transformer-based models has revolutionized natural language processing...", "status": "processing", "research": true, "iteration": 1}, "type": "section_update"}

event: data
data: {"section_update": {"name": "Machine Learning Advances", "content": "Recent developments in machine learning include:\n\n1. **Large Language Models**: GPT-4, Claude, and other advanced models\n2. **Computer Vision**: Enhanced image recognition and generation\n3. **Reinforcement Learning**: Improved decision-making algorithms", "status": "completed", "research": false}, "type": "section_update"}

event: data
data: {"content": "Research report has been completed successfully.", "type": "message", "role": "assistant"}

event: end
data: {"status": "completed"}
`,

  // Mock research report data
  mockResearchReport: {
    topic: "Artificial Intelligence Developments 2024",
    sections: {
      sections: [
        {
          name: "Introduction",
          description: "Overview of AI landscape in 2024",
          research: false,
          content: "Artificial Intelligence has continued to evolve rapidly in 2024, with breakthrough developments across multiple sectors including healthcare, finance, and technology. This report provides a comprehensive analysis of the most significant developments."
        },
        {
          name: "Large Language Models",
          description: "Advances in LLM technology and applications",
          research: true,
          content: "The field of Large Language Models has seen remarkable progress in 2024:\n\n**Key Developments:**\n- Improved reasoning capabilities\n- Better multimodal understanding\n- Enhanced code generation\n- More efficient training methods\n\n**Notable Models:**\n- GPT-4 Turbo and GPT-4V\n- Claude 3 series\n- Gemini Ultra\n- Open-source alternatives like Llama 2"
        },
        {
          name: "Computer Vision",
          description: "Breakthroughs in image and video understanding",
          research: true,
          content: "Computer vision has achieved new milestones in 2024:\n\n**Key Areas:**\n- Real-time object detection\n- Advanced image generation (DALL-E 3, Midjourney V6)\n- Video analysis and generation\n- Medical imaging applications"
        },
        {
          name: "AI Ethics and Safety",
          description: "Developments in responsible AI practices",
          research: false,
          content: "The AI community has made significant strides in addressing ethical concerns:\n\n**Key Initiatives:**\n- Enhanced bias detection and mitigation\n- Improved transparency in AI decision-making\n- Stronger data privacy protections\n- Industry-wide safety standards"
        }
      ]
    },
    content: "# Artificial Intelligence Developments 2024\n\n## Executive Summary\n\nThis comprehensive research report examines the major developments in artificial intelligence throughout 2024, highlighting breakthrough technologies, emerging applications, and important considerations for the future of AI.\n\n## Key Findings\n\n1. **LLM Evolution**: Large Language Models have become more capable and efficient\n2. **Multimodal Integration**: AI systems now better understand and generate multiple content types\n3. **Practical Applications**: Real-world deployment of AI solutions has accelerated\n4. **Ethical Progress**: Significant advances in responsible AI development\n\n## Recommendations\n\nBased on our research, we recommend continued investment in AI safety research, enhanced regulatory frameworks, and increased focus on democratizing AI access while maintaining security standards."
  },

  // Mock section updates with different statuses
  mockSectionUpdates: {
    pending: {
      name: "Research Section",
      content: "",
      status: "pending",
      research: true
    },
    processing: {
      name: "Research Section",
      content: "Research in progress...",
      status: "processing",
      research: true,
      iteration: 1
    },
    needsMoreResearch: {
      name: "Research Section",
      content: "Initial research completed, gathering additional sources...",
      status: "needs_more_research",
      research: true,
      iteration: 2
    },
    completed: {
      name: "Research Section",
      content: "Complete research findings with comprehensive analysis and citations.",
      status: "completed",
      research: false
    }
  },

  // Mock API responses for different scenarios
  apiResponses: {
    threadCreation: {
      thread_id: "test-thread-123",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      metadata: {
        assistant_id: "research_graph",
        user_id: "test-user"
      }
    },
    
    runCreation: {
      run_id: "test-run-456",
      thread_id: "test-thread-123",
      assistant_id: "research_graph",
      status: "running",
      created_at: "2024-01-15T10:01:00Z"
    },

    error: {
      error: "Internal server error",
      message: "Unable to process request",
      code: 500
    },

    timeout: {
      error: "Request timeout",
      message: "The request took too long to complete",
      code: 408
    }
  },

  // Mock user messages for testing
  mockUserMessages: [
    "Research the latest developments in artificial intelligence",
    "What are the current trends in machine learning?",
    "Analyze the impact of AI on healthcare industry",
    "Compare different large language models available in 2024",
    "Investigate the ethical implications of AI automation"
  ],

  // Mock agent responses
  mockAgentResponses: [
    "I'll research the latest AI developments for you. Let me start by gathering information from current sources.",
    "Based on my research, here are the key trends in machine learning...",
    "I've completed the analysis of AI's impact on healthcare. The findings show significant potential in diagnostics and treatment optimization.",
    "Here's a comprehensive comparison of current large language models, including their capabilities and limitations.",
    "The ethical implications of AI automation are multifaceted. Let me break down the key considerations..."
  ],

  // Mock loading states
  loadingStates: {
    initializing: "Initializing research agent...",
    analyzing: "Analyzing your research request...",
    searching: "Searching for relevant information...",
    processing: "Processing research findings...",
    generating: "Generating research report...",
    completing: "Finalizing research analysis..."
  }
};

// Helper functions for creating mock data
export const createMockSection = (overrides: Partial<any> = {}) => ({
  name: "Test Section",
  description: "Test section description",
  research: true,
  content: "",
  status: "pending",
  iteration: 1,
  ...overrides
});

export const createMockSectionUpdate = (overrides: Partial<any> = {}) => ({
  name: "Test Section",
  content: "Updated content",
  status: "completed",
  research: false,
  iteration: 1,
  ...overrides
});

export const createMockResearchData = (overrides: Partial<any> = {}) => ({
  topic: "Test Research Topic",
  sections: {
    sections: [
      createMockSection({ name: "Introduction" }),
      createMockSection({ name: "Analysis" }),
      createMockSection({ name: "Conclusion" })
    ]
  },
  content: "Test research report content",
  ...overrides
});

// Mock WebSocket events for testing streaming
export const mockWebSocketEvents = {
  connect: () => ({ type: 'connect', data: {} }),
  message: (content: string) => ({ 
    type: 'message', 
    data: { content, role: 'assistant' } 
  }),
  artifact: (data: any) => ({ 
    type: 'artifact', 
    data 
  }),
  sectionUpdate: (update: any) => ({ 
    type: 'section_update', 
    data: update 
  }),
  error: (error: string) => ({ 
    type: 'error', 
    data: { error } 
  }),
  disconnect: () => ({ type: 'disconnect', data: {} })
}; 