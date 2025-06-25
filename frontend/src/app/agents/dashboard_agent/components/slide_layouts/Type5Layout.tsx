import React from "react";
import EditableText from "../EditableText";
import { RootState } from "@/store/dashboard/store";
import { useSelector } from "react-redux";
import AllChart from "./AllChart";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type5LayoutProps {
  title: string;
  description: string;
  slideId: string | null;
  chartComponent?: React.ReactNode;
  graphData?: any;
  slideIndex: number;
  isFullSizeGraph?: boolean;
}

const Type5Layout = ({
  title,
  description,
  slideId,
  chartComponent,
  graphData,
  slideIndex,
  isFullSizeGraph = false,
}: Type5LayoutProps) => {
  const { currentColors } = useSelector((state: RootState) => state.theme);

  return (
    <div
      className={getSlideContainerClasses()}
      data-slide-element
      data-slide-index={slideIndex}
      data-slide-id={slideId}
      data-slide-type="5"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={slideDesignSystem.typography.title.spacing}>
        <EditableText
          slideIndex={slideIndex}
          elementId={`slide-${slideIndex}-title`}
          type="title"
          content={title}
          isAlingCenter={false}
        />
      </div>
      
      <div className={combineClasses(
        "flex w-full items-center",
        slideDesignSystem.content.mainSpacing,
        isFullSizeGraph 
          ? "flex-col gap-2 sm:gap-4 md:gap-6 lg:gap-10"
          : slideDesignSystem.content.gridGap
      )}>
        <div className={combineClasses(
          "w-full",
          slideDesignSystem.charts.container
        )}>
          <AllChart chartData={graphData} slideIndex={slideIndex} />
        </div>
        
        <div className={combineClasses(
          "w-full",
          isFullSizeGraph ? "text-center" : "text-left"
        )}>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-transparent">
            <EditableText
              slideIndex={slideIndex}
              elementId={`slide-${slideIndex}-description-body`}
              type="description-body"
              isAlingCenter={isFullSizeGraph}
              content={description}
            />
          </div>
        </div>
      </div>
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type5Layout;
