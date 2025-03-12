import { ContextDocument } from "@opencanvas/shared/types";

/**
 * Converts an array to a FileList object
 */
export function arrayToFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer.files;
}

/**
 * Converts documents to a format suitable for the assistant
 */
export function convertDocuments(documents: ContextDocument[]): { text: string }[] {
  return documents.map(doc => ({
    text: doc.content,
  }));
}

/**
 * Converts a ContextDocument to a File object
 */
export function contextDocumentToFile(doc: ContextDocument): File {
  return new File([doc.content], doc.name, { type: 'text/plain' });
} 