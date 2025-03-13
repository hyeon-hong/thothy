import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";

/**
 * Returns a template for the given programming language
 */
export function getLanguageTemplate(language: ProgrammingLanguageOptions): string {
  switch (language) {
    case "javascript":
      return `// JavaScript code\nconsole.log("Hello, world!");\n`;
    case "typescript":
      return `// TypeScript code\nconst greeting: string = "Hello, world!";\nconsole.log(greeting);\n`;
    case "python":
      return `# Python code\nprint("Hello, world!")\n`;
    case "java":
      return `// Java code\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}\n`;
    case "cpp":
      return `// C++ code\n#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}\n`;
    case "php":
      return `<?php\n// PHP code\necho "Hello, world!";\n?>\n`;
    case "html":
      return `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello World</title>\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n`;
    case "sql":
      return `-- SQL code\nSELECT 'Hello, world!' AS greeting;\n`;
    case "json":
      return `{\n  "greeting": "Hello, world!"\n}\n`;
    case "rust":
      return `// Rust code\nfn main() {\n  println!("Hello, world!");\n}\n`;
    case "xml":
      return `<?xml version="1.0" encoding="UTF-8"?>\n<greeting>Hello, world!</greeting>\n`;
    case "clojure":
      return `; Clojure code\n(println "Hello, world!")\n`;
    case "csharp":
      return `// C# code\nusing System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, world!");\n  }\n}\n`;
    default:
      return `// Code\nconsole.log("Hello, world!");\n`;
  }
} 