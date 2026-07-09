import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPublicTracks from "./tools/search-public-tracks";
import getTrack from "./tools/get-track";
import listMyTracks from "./tools/list-my-tracks";
import getMyProfile from "./tools/get-my-profile";
import getMyCredits from "./tools/get-my-credits";
import listMyPlaylists from "./tools/list-my-playlists";
import likeTrack from "./tools/like-track";

// Build the direct Supabase issuer from the project ref. mcp-js validates that
// the configured issuer matches the one the discovery document publishes, so
// this must be the `supabase.co` host — never the `.lovable.cloud` proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "musicverse-ai-mcp",
  title: "MusicVerse AI",
  version: "0.2.0",
  instructions:
    "Tools for MusicVerse AI — an AI music creation platform. Public: `search_public_tracks`, `get_track`. Authenticated (OAuth): `list_my_tracks`, `list_my_playlists`, `get_my_profile`, `get_my_credits`, `like_track`.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPublicTracks, getTrack, listMyTracks],
});
