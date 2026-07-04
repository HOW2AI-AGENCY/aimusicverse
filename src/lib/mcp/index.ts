import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPublicTracks from "./tools/search-public-tracks";
import getTrack from "./tools/get-track";
import listMyTracks from "./tools/list-my-tracks";

// Build the direct Supabase issuer from the project ref. mcp-js validates that
// the configured issuer matches the one the discovery document publishes, so
// this must be the `supabase.co` host — never the `.lovable.cloud` proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "musicverse-ai-mcp",
  title: "MusicVerse AI",
  version: "0.1.0",
  instructions:
    "Tools for MusicVerse AI — an AI music creation platform. Use `search_public_tracks` and `get_track` to browse the public catalog. Use `list_my_tracks` to read the signed-in user's own tracks (requires OAuth).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPublicTracks, getTrack, listMyTracks],
});
