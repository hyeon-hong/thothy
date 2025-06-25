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

interface Type7LayoutProps {
  title: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  slideId: string | null;
  icons: string[];
  icon_queries: string[];
  slideIndex: number;
}

const Type7Layout = ({
  title,
  body,
  slideId,
  icons,
  icon_queries,
  slideIndex,
}: Type7LayoutProps) => {
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
      data-slide-type="7"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={combineClasses(
        "text-center w-full",
        slideDesignSystem.typography.title.spacing
      )}>
        <EditableText
          slideIndex={slideIndex}
          elementId={`slide-${slideIndex}-title`}
          type="title"
          isAlingCenter={true}
          content={title}
        />
      </div>

      <div className="relative group">
        <div className="absolute -inset-[2px] border-2 border-transparent group-hover:border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className={combineClasses(
          "grid grid-cols-1 lg:grid-cols-3 w-full",
          slideDesignSystem.content.flexGap
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
                  "flex flex-col items-center text-center relative p-3 lg:p-6",
                  slideDesignSystem.interactive.card,
                  slideDesignSystem.interactive.hover
                )}
              >
                <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full"
                     style={{ backgroundColor: currentColors.iconBg }}>
                  {icons[index] ? (
                    <img 
                      src={icons[index]} 
                      alt={`Icon ${index}`} 
                      className="w-8 h-8 object-contain filter brightness-0 invert"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full"></div>
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
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type7Layout;
