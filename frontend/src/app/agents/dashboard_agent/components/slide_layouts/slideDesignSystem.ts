// Unified Design System for Dashboard Slides
export const slideDesignSystem = {
  // Container styling
  container: {
    base: "slide-container rounded-sm w-full max-w-[1280px] shadow-lg aspect-video bg-white relative z-20",
    padding: "px-3 sm:px-12 lg:px-20 py-[10px] sm:py-[40px] lg:py-[86px]",
    layout: "flex flex-col items-center justify-center",
    maxHeight: "max-h-[720px]",
  },
  
  // Typography hierarchy
  typography: {
    title: {
      spacing: "mb-2 lg:mb-10",
      alignment: "text-center lg:text-left",
    },
    heading: {
      spacing: "mb-2 lg:mb-4",
    },
    description: {
      spacing: "space-y-2 lg:space-y-4",
    },
  },
  
  // Content spacing and layout
  content: {
    mainSpacing: "mt-4 lg:mt-8",
    gridGap: "gap-4 sm:gap-8 md:gap-12 lg:gap-16",
    flexGap: "gap-4 lg:gap-8",
    sectionSpacing: "space-y-4 lg:space-y-12",
  },
  
  // Interactive elements
  interactive: {
    hover: "hover:shadow-lg transition-all duration-300",
    focus: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
    card: "bg-white rounded-lg shadow-sm border border-gray-100",
  },
  
  // Chart and graph styling
  charts: {
    container: "w-full h-full min-h-[200px] lg:min-h-[300px]",
    spacing: "mt-4 lg:mt-8",
  },
  
  // Demo box styling
  demoBox: {
    container: "absolute top-0 left-0 z-40",
    background: "bg-indigo-800",
    text: "text-white font-bold text-lg tracking-wide",
    padding: "px-6 py-3",
    shape: "rounded-br-lg",
    shadow: "shadow-lg",
  },
  
  // Content box styling (flexible version of demo box)
  contentBox: {
    // Variants for different positions
    positions: {
      topLeft: "absolute top-0 left-0 z-30",
      topRight: "absolute top-0 right-0 z-30",
      bottomLeft: "absolute bottom-0 left-0 z-30",
      bottomRight: "absolute bottom-0 right-0 z-30",
      inline: "relative z-20",
    },
    // Background color variants
    backgrounds: {
      primary: "bg-indigo-800",
      secondary: "bg-slate-700",
      success: "bg-emerald-600",
      warning: "bg-amber-600",
      danger: "bg-red-600",
      transparent: "bg-transparent border-2 border-indigo-800",
      white: "bg-white",
    },
    // Text styling variants
    textStyles: {
      primary: "text-white font-bold text-lg tracking-wide",
      secondary: "text-white font-medium text-base tracking-normal",
      small: "text-white font-medium text-sm tracking-wide",
      dark: "text-indigo-800 font-bold text-lg tracking-wide",
    },
    // Padding variants
    padding: {
      small: "px-4 py-2",
      medium: "px-6 py-3",
      large: "px-8 py-4",
    },
    // Shape variants
    shapes: {
      rounded: "rounded-lg",
      roundedCorner: "rounded-br-lg",
      roundedTopLeft: "rounded-tl-lg",
      roundedTopRight: "rounded-tr-lg",
      roundedBottomLeft: "rounded-bl-lg",
      roundedBottomRight: "rounded-br-lg",
      pill: "rounded-full",
    },
    // Shadow variants
    shadows: {
      none: "",
      small: "shadow-sm",
      medium: "shadow-md",
      large: "shadow-lg",
      extra: "shadow-xl",
    },
  },
  
  // Animation and transitions
  animations: {
    fadeIn: "animate-fadeIn",
    slideUp: "animate-slideUp",
    gentle: "transition-all duration-300 ease-in-out",
  },
} as const;

// Helper function to combine classes
export const combineClasses = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

// Helper function to get unified container classes
export const getSlideContainerClasses = (additionalClasses?: string): string => {
  return combineClasses(
    slideDesignSystem.container.base,
    slideDesignSystem.container.padding,
    slideDesignSystem.container.layout,
    slideDesignSystem.container.maxHeight,
    additionalClasses
  );
};

// Helper function to get demo box classes
export const getDemoBoxClasses = (): string => {
  return combineClasses(
    slideDesignSystem.demoBox.container,
    slideDesignSystem.demoBox.background,
    slideDesignSystem.demoBox.text,
    slideDesignSystem.demoBox.padding,
    slideDesignSystem.demoBox.shape,
    slideDesignSystem.demoBox.shadow
  );
};

// Helper function to get content box classes with customization options
export interface ContentBoxConfig {
  position?: keyof typeof slideDesignSystem.contentBox.positions;
  background?: keyof typeof slideDesignSystem.contentBox.backgrounds;
  textStyle?: keyof typeof slideDesignSystem.contentBox.textStyles;
  padding?: keyof typeof slideDesignSystem.contentBox.padding;
  shape?: keyof typeof slideDesignSystem.contentBox.shapes;
  shadow?: keyof typeof slideDesignSystem.contentBox.shadows;
}

export const getContentBoxClasses = (config: ContentBoxConfig = {}): string => {
  const {
    position = 'inline',
    background = 'primary',
    textStyle = 'primary',
    padding = 'medium',
    shape = 'rounded',
    shadow = 'medium'
  } = config;

  return combineClasses(
    slideDesignSystem.contentBox.positions[position],
    slideDesignSystem.contentBox.backgrounds[background],
    slideDesignSystem.contentBox.textStyles[textStyle],
    slideDesignSystem.contentBox.padding[padding],
    slideDesignSystem.contentBox.shapes[shape],
    slideDesignSystem.contentBox.shadows[shadow]
  );
}; 