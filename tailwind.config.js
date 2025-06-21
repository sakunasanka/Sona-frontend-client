/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", 
        secondary: "#fff", // Example secondary color
        gray: {
          400: "#9CA3AF", 
        },
        green: '#16a34a',
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Example font family
        serif: ["Merriweather", "serif"], // Example font family
      },
      spacing: {
        '128': '32rem', // Example custom spacing
        '144': '36rem', // Example custom spacing
      },
      borderRadius: {
        '4xl': '2rem', // Example custom border radius
      },
      boxShadow: {
        'custom': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Example custom shadow
      },
      screens: {
        '3xl': '1600px', // Example custom screen size
      },
      fontSize: {
        'xxs': '0.625rem', // Example custom font size
        'xxl': '1.5rem', // Example custom font size
      },  
    },
  },
  plugins: [],
}