import { FC } from "react";
import { Prism as SyntaxHighlighterPrism } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface SyntaxHighlighterProps {
  language: string;
  children: string;
  className?: string;
}

export const SyntaxHighlighter: FC<SyntaxHighlighterProps> = ({
  language,
  children,
  className,
}) => {
  return (
    <SyntaxHighlighterPrism
      language={language}
      style={oneDark}
      className={className}
      customStyle={{
        margin: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: "0.5rem",
        borderBottomRightRadius: "0.5rem",
      }}
    >
      {children}
    </SyntaxHighlighterPrism>
  );
};
