// images.d.ts
declare module "*.png" {
  const value: number; // for React Native using `require`
  export default value;
}

declare module "*.jpg" {
  const value: number;
  export default value;
}