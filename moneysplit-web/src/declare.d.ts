/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />

declare module "*.svg" {
  const url: string;
  export default url;
}
declare module "*?raw" {
  const content: string;
  export default content;
}
