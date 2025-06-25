import React from "react";
import EditableText from "../EditableText";
import { Plus } from "lucide-react";
import ElementMenu from "../ElementMenu";
import { useSelector } from "react-redux";
import { RootState } from "@/store/dashboard/store";
import { useSlideOperations } from "../../hooks/use-slide-operations";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type8LayoutProps {
  title: string;
  description: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  slideId: string | null;
  icons: string[];
  icon_queries: string[];
  slideIndex: number;
}

const Type8Layout = ({
  title,
  description,
  body,
  slideId,
  icons,
  icon_queries,
  slideIndex,
}: Type8LayoutProps) => {
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
      data-slide-id={slideId}
      data-slide-type="8"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={combineClasses(
        "flex flex-col lg:flex-row w-full items-center",
        slideDesignSystem.content.gridGap
      )}>
        {/* Left section - Title and Description */}
        <div className={combineClasses(
          "lg:w-1/2",
          slideDesignSystem.content.sectionSpacing
        )}>
          <EditableText
            slideIndex={slideIndex}
            elementId={`slide-${slideIndex}-title`}
            type="title"
            content={title}
          />
          <EditableText
            slideIndex={slideIndex}
            elementId={`slide-${slideIndex}-description`}
            type="description"
            content={description}
          />
        </div>

        {/* Right section - Icon items */}
        <div className="lg:w-1/2 relative group">
          <div className="absolute -inset-[2px] border-2 border-transparent group-hover:border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className={combineClasses(
            "grid grid-cols-1 gap-4",
            slideDesignSystem.content.sectionSpacing
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
                    "flex items-center gap-4 relative p-3 lg:p-4",
                    slideDesignSystem.interactive.card,
                    slideDesignSystem.interactive.hover
                  )}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                       style={{ backgroundColor: currentColors.iconBg }}>
                    {icons[index] ? (
                      <img 
                        src={icons[index]} 
                        alt={`Icon ${index}`} 
                        className="w-6 h-6 object-contain filter brightness-0 invert"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full"></div>
                    )}
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
              ))}
          </div>
        </div>
      </div>
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type8Layout;
