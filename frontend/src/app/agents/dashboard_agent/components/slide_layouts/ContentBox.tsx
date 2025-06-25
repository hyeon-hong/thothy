import React from "react";
import { getContentBoxClasses, ContentBoxConfig } from "./slideDesignSystem";

interface ContentBoxProps extends ContentBoxConfig {
  children: React.ReactNode;
  className?: string;
}

const ContentBox: React.FC<ContentBoxProps> = ({
  children,
  className,
  position,
  background,
  textStyle,
  padding,
  shape,
  shadow,
}) => {
  const boxClasses = getContentBoxClasses({
    position,
    background,
    textStyle,
    padding,
    shape,
    shadow,
  });

  return (
    <div className={`${boxClasses} ${className || ""}`}>
      {children}
    </div>
  );
};

export default ContentBox; 