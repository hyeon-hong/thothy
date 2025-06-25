import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/dashboard/store";

const SlideBranding: React.FC = () => {
  const { currentColors } = useSelector((state: RootState) => state.theme);

  return (
    <div className="absolute top-4 right-6 z-30">
      <div className="flex flex-col items-center gap-2">
        {/* Sleek rectangular box */}
        <div className="w-full h-2 bg-indigo-800 rounded-full shadow-sm opacity-60 hover:opacity-80 transition-opacity duration-300"></div>
        
        {/* Brand name */}
        <div 
          className="text-xs font-medium tracking-wide opacity-40 hover:opacity-60 transition-opacity duration-300"
          // style={{ 
          //   color: currentColors.slideDescription,
          //   fontFamily: currentColors.fontFamily || "Inter, sans-serif",
          // }}
        >
          Thothy.ai
        </div>
      </div>
    </div>
  );
};

export default SlideBranding; 