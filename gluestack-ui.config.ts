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
        500: "#0073e6",
        600: "#0059b3",
        700: "#004080",
        800: "#00264d",
        900: "#000d1a",
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
