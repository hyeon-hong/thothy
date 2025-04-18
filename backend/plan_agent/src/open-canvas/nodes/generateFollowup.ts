import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getModelFromConfig } from "../../utils.js";
import {
  getArtifactContent,
  isArtifactMarkdownContent,
} from "@opencanvas/shared/utils/artifacts";
import { Reflections } from "@opencanvas/shared/types";
import { ensureStoreInConfig, formatReflections } from "../../utils.js";
import { FOLLOWUP_ARTIFACT_PROMPT } from "../prompts.js";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state.js";
import { ChatOpenAI } from "@langchain/openai";

/**
 * Generate a followup message after generating or updating an artifact.
 */
export const generateFollowup = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  console.log("call generateFollowup()");

  // const smallModel = await getModelFromConfig(config, {
  //   maxTokens: 250,
  //   // We say tool calling is true here because that'll cause it to use a small model
  //   isToolCalling: true,
  // });
  const smallModel = new ChatOpenAI({
    modelName: "Qwen/Qwen2.5-1.5B-Instruct",
    maxTokens: 250,
    temperature: 0.5,
    openAIApiKey: "EMPTY",
    configuration: {
      baseURL: "http://192.168.75.101:8000/v1",
    },
  });

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections, {
        onlyContent: true,
      })
    : "No reflections found.";

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  const artifactContent = currentArtifactContent
    ? isArtifactMarkdownContent(currentArtifactContent)
      ? currentArtifactContent.fullMarkdown
      : currentArtifactContent.code
    : undefined;

  const formattedPrompt = FOLLOWUP_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    artifactContent || "No artifacts generated yet."
  )
    .replace("{reflections}", memoriesAsString)
    .replace(
      "{conversation}",
      state._messages
        .map((msg) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
        .join("\n\n")
    );

  // TODO: Include the chat history as well.
  const response = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);
  console.log("response: ", response);

  return {
    messages: [response],
    _messages: [response],
  };
};
