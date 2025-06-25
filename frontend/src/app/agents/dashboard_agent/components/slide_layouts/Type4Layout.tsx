import React from "react";
import EditableText from "../EditableText";
import ImageEditor from "../ImageEditor";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/dashboard/store";
import ElementMenu from "../ElementMenu";
import { Plus } from "lucide-react";
import { useSlideOperations } from "../../hooks/use-slide-operations";
import SlideFooter from "./SlideFooter";
import SlideBranding from "./SlideBranding";
import DemoBox from "./DemoBox";
import { getSlideContainerClasses, slideDesignSystem, combineClasses } from "./slideDesignSystem";

interface Type4LayoutProps {
  title: string;
  body: Array<{
    heading: string;
    description: string;
  }>;
  slideId: string | null;
  images: string[];
  slideIndex: number;
  image_prompts?: string[] | null;
  properties?: null | any;
}

const Type4Layout = ({
  title,
  body,
  slideId,
  images,
  slideIndex,
  image_prompts,
  properties,
}: Type4LayoutProps) => {
  const { currentColors } = useSelector((state: RootState) => state.theme);
  const {
    handleAddItem,
    handleDeleteItem,
    handleImageChange,
    handleDeleteImage,
  } = useSlideOperations(slideIndex);

  const AddItem = () => {
    if (body.length < 3) {
      handleImageChange({ imageUrl: "", imageIndex: slideIndex });
      handleAddItem({
        item: { heading: "Enter Heading", description: "Enter Description" },
      });
    }
  };
  
  const DeleteItem = (index: number) => {
    if (body.length > 2) {
      handleDeleteItem({ itemIndex: index });
      handleDeleteImage({ imageIndex: index });
    }
  };
  
  const getGridCols = (length: number) => {
    switch (length) {
      case 1: return 'lg:grid-cols-1';
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      default: return 'lg:grid-cols-1';
    }
  };

  return (
    <div
      className={getSlideContainerClasses()}
      data-slide-element
      data-slide-index={slideIndex}
      data-slide-id={slideId}
      data-slide-type="4"
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

      <div className={combineClasses(
        `grid grid-cols-1 ${getGridCols(body.length)} w-full relative group`,
        slideDesignSystem.content.flexGap
      )}>
        <div className="absolute -inset-[2px] border-2 border-transparent group-hover:border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        {body.map((item, index) => (
          <div
            data-slide-element
            data-slide-index={slideIndex}
            data-element-type="slide-box"
            data-element-id={`slide-${slideIndex}-item-${index}-box`}
            key={index}
            className={combineClasses(
              "flex flex-col w-full overflow-hidden relative group",
              slideDesignSystem.interactive.card,
              slideDesignSystem.interactive.hover
            )}
          >
            <div className="w-full h-48 overflow-hidden rounded-t-lg">
              <img 
                src={images[index]} 
                alt="slide-image" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            
            {/* COMMENTED OUT: ImageEditor component
            <ImageEditor
              elementId={`slide-${slideIndex}-item-${index}-image`}
              slideIndex={slideIndex}
              initialImage={images[index]}
              className="max-md:h-[140px] max-lg:h-[180px] h-48 w-full rounded-t-lg rounded-b-none"
              title={item.heading}
              promptContent={image_prompts?.[index]}
              imageIdx={index}
              properties={properties}
            />
            */}

            <div className={combineClasses(
              "p-3 lg:p-6",
              slideDesignSystem.content.sectionSpacing
            )}>
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
      
      <SlideFooter slideIndex={slideIndex} />
      <SlideBranding />
    </div>
  );
};

export default Type4Layout;
