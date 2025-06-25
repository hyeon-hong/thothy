import React from "react";
import EditableText from "../EditableText";
import { Plus } from "lucide-react";
import ElementMenu from "../ElementMenu";
import { useSelector } from "react-redux";
import { numberTranslations } from "../../utils/others";
import { RootState } from "@/store/dashboard/store";
import AllChart from "./AllChart";
import { useSlideOperations } from "../../hooks/use-slide-operations";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type9LayoutProps {
  title: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  graphData?: any;
  slideId: string | null;
  language: string;
  slideIndex: number;
}

const Type9Layout = ({
  title,
  body,
  graphData,
  slideId,
  slideIndex,
  language,
}: Type9LayoutProps) => {
  const { currentColors } = useSelector((state: RootState) => state.theme);
  const { handleAddItem, handleDeleteItem } = useSlideOperations(slideIndex);
  
  const AddItem = () => {
    if (body.length < 3) {
      handleAddItem({ item: { heading: "", description: "" } });
    }
  };
  
  const DeleteItem = (index: number) => {
    if (body.length > 2) {
      handleDeleteItem({ itemIndex: index });
    }
  };
  
  return (
    <div
      className={getSlideContainerClasses()}
      data-slide-element
      data-slide-index={slideIndex}
      data-slide-type="9"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      data-slide-id={slideId}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={combineClasses(
        "grid grid-cols-1 lg:grid-cols-2 w-full items-center",
        slideDesignSystem.content.gridGap
      )}>
        {/* Left section - Chart */}
        <div className={slideDesignSystem.content.sectionSpacing}>
          <EditableText
            slideIndex={slideIndex}
            elementId={`slide-${slideIndex}-title`}
            type="title"
            content={title}
          />
          <div className="flex items-center justify-center">
            <div className={combineClasses(
              "w-full",
              slideDesignSystem.charts.container
            )}>
              <AllChart chartData={graphData} slideIndex={slideIndex} />
            </div>
          </div>
        </div>

        {/* Right section - Numbered items */}
        <div className="relative group">
          <div className="absolute -inset-[2px] border-2 hidden lg:block border-transparent group-hover:border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className={combineClasses(
            "space-y-4 lg:space-y-6"
          )}>
            {body.length > 0 &&
              body.map((item, index) => (
                <div
                  data-slide-element
                  data-slide-index={slideIndex}
                  data-element-type="slide-box"
                  data-element-id={`slide-${slideIndex}-item-${index}-box`}
                  key={`${body.length}-${index}`}
                  className={combineClasses(
                    "relative p-3 lg:p-6",
                    slideDesignSystem.interactive.card,
                    slideDesignSystem.interactive.hover
                  )}
                >
                  <div className="flex gap-3 lg:gap-6">
                    <div
                      data-slide-element
                      data-slide-index={slideIndex}
                      data-element-type="text"
                      data-element-id={`slide-${slideIndex}-item-${index}-number`}
                      className="text-[32px] leading-[40px] px-1 font-bold mb-4 flex-shrink-0"
                      style={{
                        color: currentColors.iconBg,
                      }}
                    >
                      {numberTranslations[language][index || 0]}
                    </div>

                    <div className={slideDesignSystem.content.sectionSpacing}>
                      <EditableText
                        slideIndex={slideIndex}
                        elementId={`slide-${slideIndex}-item-${index}-heading`}
                        type="heading"
                        bodyIdx={index}
                        content={item.heading}
                      />
                      <EditableText
                        slideIndex={slideIndex}
                        elementId={`slide-${slideIndex}-item-${index}-description`}
                        type="heading-description"
                        bodyIdx={index}
                        content={item.description}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type9Layout;
