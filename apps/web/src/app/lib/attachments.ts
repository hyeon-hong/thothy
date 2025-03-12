import { ContextDocument } from "@opencanvas/shared/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

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
export async function convertDocuments({
  ffmpeg: _ffmpeg,
  messageRef: _messageRef,
  documents: _documents,
  userId: _userId,
  toast: _toast,
}: {
  ffmpeg: FFmpeg;
  messageRef: React.RefObject<HTMLDivElement>;
  documents: FileList;
  userId: string;
  toast: any;
}): Promise<ContextDocument[]> {
  // Implementation would go here
  return [];
}

/**
 * Converts a ContextDocument to a File object
 */
export function contextDocumentToFile(doc: ContextDocument): File {
  return new File([doc.data], doc.name, { type: doc.type || 'text/plain' });
}

/**
 * Loads FFmpeg
 */
export async function load(ffmpeg: FFmpeg, _messageRef: React.RefObject<HTMLDivElement>) {
  try {
    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return true;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    return false;
  }
} 