declare module "*.svg" {
  const url: string;
  export default url;
}
declare module "*?raw" {
  const content: string;
  export default content;
}
declare module "material-symbols:*" {
  const content: string;
  export default content;
}
