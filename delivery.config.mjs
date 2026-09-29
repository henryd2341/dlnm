// This file owns our hosting addresses; upstream MVU URLs remain pinned separately.
export const devOrigin = "http://127.0.0.1:5173";
export const assetBaseUrl =
  process.env.DLNM_ASSET_BASE_URL || "https://henryd2341.github.io/dlnm/";
// Explicit build-time choice; formal mode never falls back to this computer's public assets.
export const imageSource = "gremlin"; // 'development' | 'gremlin'; DLNM_IMAGE_SOURCE overrides for a build.
export const hostOrigins = ["http://127.0.0.1:8000", "http://localhost:8000"];
// The existing character's PNG filename, not its display name. No discovery or matching pass.
export const tavernOrigin = "http://127.0.0.1:8000";
export const characterFile = "魔族大小姐与女仆的30天·续.png";
