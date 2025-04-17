import {
  createContextDocumentMessages,
  getFormattedReflections,
  getModelConfig,
  getModelFromConfig,
  isUsingO1MiniModel,
  optionallyGetSystemPromptFromConfig,
} from "../../../utils.js";
import { ArtifactV3 } from "@opencanvas/shared/types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../../state.js";
import { ARTIFACT_TOOL_SCHEMA } from "./schemas.js";
import { createArtifactContent, formatNewArtifactPrompt } from "./utils.js";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";

/**
 * Generate a new artifact based on the user's query.
 */
export const generateArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelName } = getModelConfig(config, {
    isToolCalling: true,
  });
  // TODO: Handle this in the config
  // const smallModel = await getModelFromConfig(config, {
  //   temperature: 0.5,
  //   isToolCalling: true,
  // });
  const smallModel = new ChatOllama({
    model: "qwen2.5-coder:32b",
    baseUrl: "http://192.168.75.101:11434",
    temperature: 0.5,
    format: "json",
  });

  const generateArtifactTool = tool((_) => "", {
    name: "generate_artifact",
    description: ARTIFACT_TOOL_SCHEMA.description,
    schema: ARTIFACT_TOOL_SCHEMA,
  });
  const modelWithArtifactTool = smallModel.bindTools([generateArtifactTool]);
  const memoriesAsString = await getFormattedReflections(config);
  const formattedNewArtifactPrompt = formatNewArtifactPrompt(
    memoriesAsString,
    modelName
  );

  const userSystemPrompt = optionallyGetSystemPromptFromConfig(config);
  const fullSystemPrompt = userSystemPrompt
    ? `${userSystemPrompt}\n${formattedNewArtifactPrompt}`
    : formattedNewArtifactPrompt;

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const isO1MiniModel = isUsingO1MiniModel(config);

  const response = await modelWithArtifactTool.invoke(
    [
      { role: isO1MiniModel ? "user" : "system", content: fullSystemPrompt },
      ...contextDocumentMessages,
      ...state._messages,
    ],
    { runName: "generate_artifact" }
  );

  // Extract the arguments object portion using regex
  const args = response.tool_calls?.[0]?.args as
    | z.infer<typeof ARTIFACT_TOOL_SCHEMA>
    | undefined;

  if (!args) {
    throw new Error("No args found in response");
  }

  const newArtifactContent = createArtifactContent(args);

  const newArtifact: ArtifactV3 = {
    currentIndex: 1,
    contents: [newArtifactContent],
  };

  return {
    artifact: newArtifact,
  };
};
