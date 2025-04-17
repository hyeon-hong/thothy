import { extractUrls } from "@opencanvas/shared/utils/urls";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../../state.js";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { dynamicDeterminePath } from "./dynamic-determine-path.js";
import {
  convertContextDocumentToHumanMessage,
  fixMisFormattedContextDocMessage,
} from "./documents.js";
import { getStringFromContent } from "../../../utils.js";
import { includeURLContents } from "./include-url-contents.js";

function extractURLsFromLastMessage(messages: BaseMessage[]): string[] {
  const recentMessage = messages[messages.length - 1];
  const recentMessageContent = getStringFromContent(recentMessage.content);
  const messageUrls = extractUrls(recentMessageContent);
  return messageUrls;
}

/**
 * Routes to the proper node in the graph based on the user's query.
 */
export async function generatePath(
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> {
  console.log("call generatePath()");

  const { _messages } = state;
  const newMessages: BaseMessage[] = [];
  const docMessage = await convertContextDocumentToHumanMessage(
    _messages,
    config
  );
  console.log("docMessage: ", docMessage);

  const existingDocMessage = newMessages.find(
    (m) =>
      Array.isArray(m.content) &&
      m.content.some(
        (c) => c.type === "document" || c.type === "application/pdf"
      )
  );
  console.log("existingDocMessage: ", existingDocMessage);

  if (docMessage) {
    newMessages.push(docMessage);
  } else if (existingDocMessage) {
    const fixedMessages = await fixMisFormattedContextDocMessage(
      existingDocMessage,
      config
    );
    if (fixedMessages) {
      newMessages.push(...fixedMessages);
    }
  }
  console.log("newMessages: ", newMessages);

  if (state.highlightedCode) {
    console.log("highlightedCode");
    return {
      next: "updateArtifact",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }
  if (state.highlightedText) {
    console.log("highlightedText");
    return {
      next: "updateHighlightedText",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }

  if (
    state.language ||
    state.artifactLength ||
    state.regenerateWithEmojis ||
    state.readingLevel
  ) {
    console.log("rewriteArtifactTheme");
    return {
      next: "rewriteArtifactTheme",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }

  if (
    state.addComments ||
    state.addLogs ||
    state.portLanguage ||
    state.fixBugs
  ) {
    console.log("rewriteCodeArtifactTheme");
    return {
      next: "rewriteCodeArtifactTheme",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }

  if (state.customQuickActionId) {
    console.log("customAction");
    return {
      next: "customAction",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }

  if (state.webSearchEnabled) {
    console.log("webSearch");
    return {
      next: "webSearch",
      ...(newMessages.length
        ? { messages: newMessages, _messages: newMessages }
        : {}),
    };
  }

  // Check if any URLs are in the latest message. If true, determine if the contents should be included
  // inline in the prompt, and if so, scrape the contents and update the prompt.
  const messageUrls = extractURLsFromLastMessage(state._messages);
  let updatedMessageWithContents: HumanMessage | undefined = undefined;
  if (messageUrls.length) {
    updatedMessageWithContents = await includeURLContents(
      state._messages[state._messages.length - 1],
      messageUrls
    );
  }
  console.log("updatedMessageWithContents: ", updatedMessageWithContents);

  // Update the internal message list with the new message, if one was generated
  const newInternalMessageList = updatedMessageWithContents
    ? state._messages.map((m) => {
        if (m.id === updatedMessageWithContents.id) {
          console.log("updatedMessageWithContents");
          return updatedMessageWithContents;
        } else {
          console.log("m: ", m);
          return m;
        }
      })
    : state._messages;
  console.log("newInternalMessageList: ", newInternalMessageList);

  const routingResult = await dynamicDeterminePath({
    state: {
      ...state,
      _messages: newInternalMessageList,
    },
    newMessages,
    config,
  });
  console.log("routingResult: ", routingResult);

  const route = routingResult?.route;
  console.log("route: ", route);

  if (!route) {
    throw new Error("Route not found");
  }

  // Create the messages object including the new messages if any
  const messages = newMessages.length
    ? {
        messages: newMessages,
        _messages: [...newInternalMessageList, ...newMessages],
      }
    : {
        _messages: newInternalMessageList,
      };

  console.log("returning from generatePath()");
  return {
    next: route,
    ...messages,
  };
}
