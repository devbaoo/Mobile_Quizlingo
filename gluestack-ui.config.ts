import { createConfig } from "@gluestack-ui/themed";

export const config = createConfig({
  tokens: {
    colors: {
      primary: {
        50: "#e6f2ff",
        100: "#b3d9ff",
        200: "#80bfff",
        300: "#4da6ff",
        400: "#1a8cff",
        500: "#0073e6", // Main app blue
        600: "#0059b3",
        700: "#004080",
        800: "#00264d",
        900: "#000d1a",
      },
      secondary: {
        50: "#f5fbff",
        100: "#e6f7ff",
        200: "#c5eaff",
        300: "#a1daff",
        400: "#79c9ff",
        500: "#58CC02", // App green
        600: "#4ba300",
        700: "#3b7a00",
        800: "#295200",
        900: "#162a00",
      },
      amber: {
        50: "#fff8e6",
        100: "#ffebcc",
        200: "#ffd699",
        300: "#ffc266",
        400: "#ffad33",
        500: "#ff9900",
        600: "#cc7a00",
        700: "#995c00",
        800: "#663d00",
        900: "#331f00",
      },
      red: {
        50: "#ffe6e6",
        100: "#ffcccc",
        200: "#ff9999",
        300: "#ff6666",
        400: "#ff3333",
        500: "#ff0000",
        600: "#cc0000",
        700: "#990000",
        800: "#660000",
        900: "#330000",
      },
    },
  },
  aliases: {
    bg: "backgroundColor",
    h: "height",
    w: "width",
    p: "padding",
    px: "paddingHorizontal",
    py: "paddingVertical",
    pt: "paddingTop",
    pb: "paddingBottom",
    pl: "paddingLeft",
    pr: "paddingRight",
    m: "margin",
    mx: "marginHorizontal",
    my: "marginVertical",
    mt: "marginTop",
    mb: "marginBottom",
    ml: "marginLeft",
    mr: "marginRight",
  },
});

export default config;
