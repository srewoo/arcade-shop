// Player car paint palette and model display names (garage options).

/** 17 paint schemes (the first 11 are the originals). `main` = body colour, `accent` = stripe / trim colour. */
export const CAR_COLORS = [
  { name: "Red", main: "#d01712", accent: "#f2cd37" },
  { name: "Blue", main: "#0a57c2", accent: "#f4f4f4" },
  { name: "Yellow", main: "#f2cd37", accent: "#1b2a34" },
  { name: "Green", main: "#237841", accent: "#f2cd37" },
  { name: "Orange", main: "#fe8a18", accent: "#1b2a34" },
  { name: "White", main: "#f4f4f4", accent: "#c91a09" },
  { name: "Lime", main: "#a5ca18", accent: "#1b2a34" },
  { name: "Pink", main: "#e4619f", accent: "#f4f4f4" },
  { name: "Purple", main: "#6b32a8", accent: "#f2cd37" },
  { name: "Teal", main: "#0f9aa0", accent: "#f4f4f4" },
  { name: "Black", main: "#23262b", accent: "#fe8a18" },
  // added later: appended so saved colour indices keep their meaning
  { name: "Navy", main: "#1c2f6e", accent: "#f2cd37" },
  { name: "Mint", main: "#4fd1a5", accent: "#1b2a34" },
  { name: "Gold", main: "#d4a017", accent: "#1b2a34" },
  { name: "Maroon", main: "#7a1f2b", accent: "#f4f4f4" },
  { name: "Sky", main: "#5bb8f0", accent: "#1b2a34" },
  { name: "Silver", main: "#aab2bd", accent: "#c91a09" },
];

/** Display names for the 4 models of each car kind (index = model). */
export const MODEL_NAMES = {
  classic: ["Coupe", "Pickup", "Van", "Formula"],
  lego: ["Coupe", "Pickup", "Van", "Racer"],
};
