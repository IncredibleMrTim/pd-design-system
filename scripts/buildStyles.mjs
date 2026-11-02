// Writes dist/styles.css: the theme tokens plus a Tailwind @source line, so a
// using app only needs one import to get the classes the components use.
// Tailwind skips node_modules unless told otherwise, hence the explicit @source.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const theme = readFileSync("src/styles/theme.css", "utf8");

mkdirSync("dist", { recursive: true });
writeFileSync(
  "dist/styles.css",
  `@source "./";\n\n${theme}`,
);
