// Copies the static runtime files that index.html references by plain URL into public/.
// (public/boot.js and public/boot.css, the loading bar, are hand-written source, not copied.)
//   maps/*     <- original/maps               (routes.json + <id>.jpg rug textures)
//   parquet.jpg<- original/parquet.jpg        (boot screen background)
import { cpSync, mkdirSync, copyFileSync } from "node:fs";
mkdirSync("public", { recursive: true });
cpSync("original/maps", "public/maps", { recursive: true });
copyFileSync("original/parquet.jpg", "public/parquet.jpg");

// Shaped-rug previews (extra-maps/<id>.png with transparent corners) and their route centrelines,
// merged into public/maps/routes.json so the map picker can preview them.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
for (const file of readdirSync("extra-maps")) {
  if (file.endsWith(".png")) copyFileSync(`extra-maps/${file}`, `public/maps/${file}`);
}
const routes = JSON.parse(readFileSync("public/maps/routes.json", "utf8"));
Object.assign(routes, JSON.parse(readFileSync("extra-maps/routes-extra.json", "utf8")));
writeFileSync("public/maps/routes.json", JSON.stringify(routes));
