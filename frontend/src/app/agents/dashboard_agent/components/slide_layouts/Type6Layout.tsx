import React from "react";
import EditableText from "../EditableText";
import { Plus } from "lucide-react";
import ElementMenu from "../ElementMenu";
import { useSelector } from "react-redux";
import { numberTranslations } from "../../utils/others";
import { RootState } from "@/store/dashboard/store";
import { useSlideOperations } from "../../hooks/use-slide-operations";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type6LayoutProps {
  title: string;
  description: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  slideId: string | null;
  language: string;
  slideIndex: number;
}

const Type6Layout = ({
  title,
  description,
  body,
  slideId,
  slideIndex,
  language,
}: Type6LayoutProps) => {
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
      data-slide-type="6"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={combineClasses(
        "text-center w-full",
        slideDesignSystem.typography.title.spacing,
        slideDesignSystem.content.sectionSpacing
      )}>
        <EditableText
          slideIndex={slideIndex}
          elementId={`slide-${slideIndex}-title`}
          type="title"
          isAlingCenter={true}
          content={title}
        />
        <EditableText
          slideIndex={slideIndex}
          elementId={`slide-${slideIndex}-description`}
          type="description"
          isAlingCenter={true}
          content={description}
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
                  "relative p-3 lg:p-6",
                  slideDesignSystem.interactive.card,
                  slideDesignSystem.interactive.hover
                )}
              >
                <div className="flex gap-3">
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
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type6Layout;
