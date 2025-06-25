import React from "react";
import EditableText from "../EditableText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus } from "lucide-react";
import ElementMenu from "../ElementMenu";
import { useSelector } from "react-redux";
import { numberTranslations } from "../../utils/others";
import { RootState } from "@/store/dashboard/store";
import { useSlideOperations } from "../../hooks/use-slide-operations";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type2LayoutProps {
  title: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  slideId: string | null;
  slideIndex: number;
  language: string;
  design_index: number;
}

const Type2Layout = ({
  title,
  body,
  slideId,
  slideIndex,
  design_index,
  language,
}: Type2LayoutProps) => {
  const { currentColors } = useSelector((state: RootState) => state.theme);
  const { handleAddItem, handleDeleteItem, handleVariantChange } = useSlideOperations(slideIndex);

  const onAddItem = () => {
    if (body.length < 4) {
      handleAddItem({ item: { heading: "", description: "" } });
    }
  };

  const onDeleteItem = (index: number) => {
    if (body.length > 2) {
      handleDeleteItem({ itemIndex: index });
    }
  };

  const VariantMenu = () => null;
  const isGridLayout = body.length === 4;

  const renderContent = () => {
    if (design_index === 3) {
      return (
        <div className={combineClasses(
          "w-full flex flex-col relative group",
          slideDesignSystem.content.mainSpacing
        )}>
          <div className="absolute -inset-[2px] border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <VariantMenu />

          {/* Timeline Header with Numbers and Line */}
          <div className="relative flex justify-between w-[85%] mx-auto items-center mb-8 px-8">
            {/* Horizontal Line */}
            <div
              data-slide-element
              data-slide-index={slideIndex}
              data-element-type="line"
              data-element-id={`slide-${slideIndex}-horizontal-line`}
              className="absolute top-1/2 w-[87%] left-1/2 -translate-x-1/2 h-[2px]"
              style={{
                backgroundColor: currentColors.iconBg,
              }}
            />

            {/* Timeline Numbers */}
            {body.map((_, index) => (
              <div
                data-slide-element
                data-slide-index={slideIndex}
                data-element-type="filledbox"
                data-element-id={`slide-${slideIndex}-timeline-number-${index}`}
                key={`timeline-${index}`}
                className="relative z-10 w-12 h-12 rounded-full px-1 text-white flex items-center justify-center font-bold text-lg shadow-lg"
                style={{
                  backgroundColor: currentColors.iconBg,
                }}
              >
                <span
                  data-slide-element
                  data-slide-index={slideIndex}
                  data-element-type="text"
                  data-element-id={`slide-${slideIndex}-timeline-number-text-${index}`}
                >
                  {numberTranslations[language][index || 0]}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div className={combineClasses(
            "flex justify-between",
            slideDesignSystem.content.flexGap
          )}>
            {body.map((item, index) => (
              <div
                key={`${body.length}-${index}`}
                className="flex-1 text-center relative"
              >
                <div className={slideDesignSystem.content.sectionSpacing}>
                  <EditableText
                    slideIndex={slideIndex}
                    elementId={`slide-${slideIndex}-item-${index}-heading`}
                    type="heading"
                    content={item.heading}
                  />
                  <EditableText
                    slideIndex={slideIndex}
                    elementId={`slide-${slideIndex}-item-${index}-description`}
                    type="heading-description"
                    content={item.description}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isGridLayout) {
      return (
        <div className={combineClasses(
          "grid grid-cols-1 lg:grid-cols-2 relative group",
          slideDesignSystem.content.mainSpacing,
          design_index === 2 ? slideDesignSystem.content.flexGap : slideDesignSystem.content.gridGap
        )}>
          <div className="absolute -inset-[2px] border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <VariantMenu />

          {body.map((item, index) => (
            <div
              key={index}
              data-slide-element
              data-slide-index={slideIndex}
              data-element-type={design_index === 2 ? "slide-box" : ""}
              data-element-id={`slide-${slideIndex}-item-${index}-box`}
              className={combineClasses(
                "w-full relative group",
                design_index === 2 
                  ? combineClasses(slideDesignSystem.interactive.card, "p-3 lg:p-6")
                  : "",
                slideDesignSystem.interactive.hover
              )}
            >
              <div className="flex gap-3">
                {design_index === 2 && (
                  <div
                    data-slide-element
                    data-slide-index={slideIndex}
                    data-element-type="text"
                    data-element-id={`slide-${slideIndex}-item-${index}-number`}
                    className="text-[32px] leading-[40px] px-1 font-bold mb-4"
                    style={{
                      color: currentColors.iconBg,
                    }}
                  >
                    {numberTranslations[language as keyof typeof numberTranslations][index]}
                  </div>
                )}
                <div className={slideDesignSystem.content.sectionSpacing}>
                  <EditableText
                    slideIndex={slideIndex}
                    elementId={`slide-${slideIndex}-item-${index}-heading`}
                    type="heading"
                    content={item.heading}
                    bodyIdx={index}
                  />
                  <EditableText
                    slideIndex={slideIndex}
                    elementId={`slide-${slideIndex}-item-${index}-description`}
                    type="heading-description"
                    content={item.description}
                    bodyIdx={index}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Horizontal layout for 2-3 items
    return (
      <div className={combineClasses(
        "flex flex-col lg:flex-row w-full relative group",
        slideDesignSystem.content.mainSpacing,
        design_index === 2 ? slideDesignSystem.content.flexGap : slideDesignSystem.content.gridGap
      )}>
        <div className="absolute -inset-[2px] hidden lg:block border-2 border-transparent group-hover:border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <VariantMenu />

        {body.map((item, index) => (
          <div
            data-slide-element
            data-slide-index={slideIndex}
            data-element-type="slide-box"
            data-element-id={`slide-${slideIndex}-item-${index}-box`}
            key={`${body.length}-${index}`}
            className={combineClasses(
              "w-full relative",
              design_index === 2 
                ? combineClasses(slideDesignSystem.interactive.card, "p-3 lg:p-6")
                : "",
              slideDesignSystem.interactive.hover
            )}
          >
            {design_index === 2 && (
              <div
                data-slide-element
                data-slide-index={slideIndex}
                data-element-type="text"
                data-element-id={`slide-${slideIndex}-item-${index}-number`}
                className="text-[32px] leading-[40px] font-semibold lg:mb-4"
                style={{
                  color: currentColors.iconBg,
                }}
              >
                {numberTranslations[language as keyof typeof numberTranslations][index]}
              </div>
            )}
            <div className={slideDesignSystem.content.sectionSpacing}>
              <EditableText
                slideIndex={slideIndex}
                bodyIdx={index}
                elementId={`slide-${slideIndex}-item-${index}-heading`}
                type="heading"
                content={item.heading}
              />
              <EditableText
                slideIndex={slideIndex}
                bodyIdx={index}
                elementId={`slide-${slideIndex}-item-${index}-description`}
                type="heading-description"
                content={item.description}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={getSlideContainerClasses()}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
      data-slide-element
      data-slide-index={slideIndex}
      data-slide-id={slideId}
      data-element-type="slide-container"
      data-slide-type="2"
      data-element-id={`slide-${slideIndex}-container`}
      data-design-index={design_index}
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

      {renderContent()}
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type2Layout;
