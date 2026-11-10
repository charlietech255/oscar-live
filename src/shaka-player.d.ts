declare module "shaka-player" {
  const shaka: any;
  export default shaka;
}

declare module "shaka-player/dist/shaka-player.ui.js" {
  const shaka: any;
  export default shaka;
}

interface Window {
  shaka?: any;
}

