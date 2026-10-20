/** The sandbox does not serve the asset gateway; use the app's hosted gateway there. */
export function assetUrl(asset: { url: string }): string {
  return typeof window !== "undefined" && window.location.hostname === "localhost"
    ? new URL(asset.url, "https://futebol-game.lovable.app").href
    : asset.url;
}