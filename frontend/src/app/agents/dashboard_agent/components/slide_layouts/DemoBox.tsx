import React from "react";
import { getDemoBoxClasses } from "./slideDesignSystem";

const DemoBox: React.FC = () => {
  return (
    <div className={getDemoBoxClasses()}>
      Demo
    </div>
  );
};

export default DemoBox; 