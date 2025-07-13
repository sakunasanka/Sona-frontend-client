// utils/postColors.ts
// A utility to manage post background colors in a sequential manner

// Define a pool of colors
const POST_COLORS = [
  '#F0F4F8', // Light blue/gray
  '#FFF0F0', // Light pink
  '#F0FFF4', // Light mint
  '#FFF8F0'  // Light peach
];

// Track the current color index
let currentColorIndex = 0;

/**
 * Gets the next color from the color pool in a sequential manner
 * @returns The next color in the sequence
 */
export const getNextPostColor = (): string => {
  // Get the current color
  const color = POST_COLORS[currentColorIndex];
  
  // Increment index for next time, wrapping around if needed
  currentColorIndex = (currentColorIndex + 1) % POST_COLORS.length;
  
  return color;
};

/**
 * Reset the color index to start from the beginning of the sequence
 */
export const resetPostColorSequence = (): void => {
  currentColorIndex = 0;
};
