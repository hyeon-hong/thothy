import { ThemeType } from "@/app/agents/dashboard_agent/upload/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const defaultColors = {
  light: {
    background: "#c8c7c9",
    slideBg: "#F2F2F2",
    slideTitle: "#1a1a1a",
    slideHeading: "#1a1a1a",
    slideDescription: "#404040",
    slideBox: "#ffffff",
    iconBg: "#1F1F2D",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-inter)",
  },
  dark: {
    background: "#000000",
    slideBg: "#1E1E1E",
    slideTitle: "#ffffff",
    slideHeading: "#f5f5f5",
    slideDescription: "#e0e0e0",
    slideBox: "#2d2d2d",
    iconBg: "#5E8CF0",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-inter)",
  },
  faint_yellow: {
    background: "#d9cebc",
    slideBg: "#F8F4E8",
    slideTitle: "#1a1a1a",
    slideHeading: "#2d2d2d",
    slideDescription: "#404040",
    slideBox: "#FFFFFF",
    iconBg: "#281810",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-inter)",
  },
  custom: {
    background: "#63ceff",
    slideBg: "#F4F4F4",
    slideTitle: "#1a1a1a",
    slideHeading: "#2d2d2d",
    slideDescription: "#404040",
    slideBox: "#d8c6c6",
    iconBg: "#281810",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-inter)",
  },
  cream: {
    background: "#DDCFBB",
    slideBg: "#F9F6F0",
    slideTitle: "#1a1a1a",
    slideHeading: "#2d2d2d",
    slideDescription: "#404040",
    slideBox: "#EEE9DD",
    iconBg: "#A6825B",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-fraunces)",
  },
  royal_blue: {
    background: "#010103",
    slideBg: "#091433",
    slideTitle: "#ffffff",
    slideHeading: "#ffffff",
    slideDescription: "#E6E6E6",
    slideBox: "#29136C",
    iconBg: "#5E8CF0",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-instrument-sans)",
  },
  light_red: {
    background: "#F8E9E8",
    slideBg: "#FFFAFA",
    slideTitle: "#1a1a1a",
    slideHeading: "#2d2d2d",
    slideDescription: "#404040",
    slideBox: "#F3E8E8",
    iconBg: "#F0695F",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-montserrat)",
  },
  dark_pink: {
    background: "#F3AEED",
    slideBg: "#F9E8FF",
    slideTitle: "#1a1a1a",
    slideHeading: "#2d2d2d",
    slideDescription: "#404040",
    slideBox: "#F0D4F7",
    iconBg: "#D02CE5",
    chartColors: ["#1a1a1a", "#2d2d2d", "#404040", "#595959", "#737373"],
    fontFamily: "var(--font-inria-serif)",
  },
};

// Store the server-provided colors
export const serverColors: { [key in ThemeType]?: ThemeColors } = {};

export interface ThemeColors {
  background: string;
  slideBg: string;
  slideTitle: string;
  slideHeading: string;
  slideDescription: string;
  slideBox: string;
  iconBg: string;
  chartColors: string[];
  fontFamily: string;
}

interface ThemeState {
  currentTheme: ThemeType;
  currentColors: ThemeColors;
  isLoading: boolean;
}

const initialState: ThemeState = {
  currentTheme: ThemeType.Dark,
  currentColors: defaultColors.dark,
  isLoading: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.currentTheme = action.payload;
      // Use server colors if available, otherwise fall back to default
      state.currentColors =
        serverColors[action.payload] || defaultColors[action.payload];
    },
    setThemeColors: (
      state,
      action: PayloadAction<Partial<ThemeColors> & { theme: ThemeType }>
    ) => {
      const newColors = { ...state.currentColors, ...action.payload };
      state.currentColors = newColors;
      state.currentTheme = action.payload.theme;
      // Store the colors for this theme
      serverColors[action.payload.theme] = newColors;
    },
    setLoadingState: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    loadSavedTheme: (state, action: PayloadAction<any>) => {
      if (action.payload.name === "custom") {
        state.currentTheme = ThemeType.Custom;
        state.currentColors = action.payload.colors;
        serverColors.custom = action.payload.colors;
      }
    },
  },
});

export const { setTheme, setThemeColors, setLoadingState, loadSavedTheme } =
  themeSlice.actions;
export default themeSlice.reducer;
