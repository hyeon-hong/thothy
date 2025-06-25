import React from "react";
import EditableText from "../EditableText";
import ImageEditor from "../ImageEditor";
import { useSelector } from "react-redux";
import { RootState } from "@/store/dashboard/store";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import ContentBox from "./ContentBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type1LayoutProps {
  title: string;
  description: string;
  slideId: string | null;
  images: string[];
  slideIndex: number;
  image_prompts?: string[] | null;
  properties?: null | any;
}

const Type1Layout = ({
  title,
  description,
  images,
  slideId,
  slideIndex,
  image_prompts,
  properties,
}: Type1LayoutProps) => {
  const { currentColors } = useSelector((state: RootState) => state.theme);
  
  return (
    <div
      className={getSlideContainerClasses()}
      data-slide-element
      data-slide-id={slideId}
      data-slide-index={slideIndex}
      data-slide-type="1"
      data-element-type="slide-container"
      data-element-id={`slide-${slideIndex}-container`}
      style={{
        fontFamily: currentColors.fontFamily || "Inter, sans-serif",
      }}
    >
      <DemoBox />
      
      <div className={combineClasses(
        "grid grid-cols-1 lg:grid-cols-2 w-full",
        slideDesignSystem.content.gridGap
      )}>
        <div className={combineClasses(
          "flex flex-col w-full items-start justify-center",
          slideDesignSystem.content.sectionSpacing
        )}>
          {/* Main Title in ContentBox */}
          <ContentBox 
            position="inline" 
            background="primary" 
            shape="rounded"
            padding="medium"
            shadow="medium"
            className="w-full mb-4 py-8"
          >
            <div className="flex flex-col gap-2">
              <EditableText
                slideIndex={slideIndex}
                elementId={`slide-${slideIndex}-title`}
                type="title"
                content={title}
              />
            </div>
            <div className="flex flex-col gap-2 mt-5">
            <ContentBox
                position="inline"
                background="white"
                shape="rounded"
                padding="medium"
                shadow="medium"
                textStyle="dark"
              >
                <EditableText
                  slideIndex={slideIndex}
                  elementId={`slide-${slideIndex}-description-body`}
                  type="description-body"
                  content={description}
                />
              </ContentBox>
            </div>
          </ContentBox>
        </div>

        <div className="relative w-full h-full">
          {/* Full-size image covering the entire right half */}
          <img 
            src={images[0]} 
            alt="slide-image" 
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* COMMENTED OUT: ImageEditor component
        <ImageEditor
          elementId={`slide-${slideIndex}-image`}
          slideIndex={slideIndex}
          initialImage={images[0]}
          title={title}
          promptContent={image_prompts?.[0]}
          properties={properties}
        />
        */}
      </div>
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type1Layout;
