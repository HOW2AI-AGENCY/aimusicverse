import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPublicTracks from "./tools/search-public-tracks";
import getTrack from "./tools/get-track";
import listMyTracks from "./tools/list-my-tracks";
import getMyProfile from "./tools/get-my-profile";
import getMyCredits from "./tools/get-my-credits";
import listMyPlaylists from "./tools/list-my-playlists";
import likeTrack from "./tools/like-track";
import createPlaylist from "./tools/create-playlist";
import addTrackToPlaylist from "./tools/add-track-to-playlist";
import removeTrackFromPlaylist from "./tools/remove-track-from-playlist";
import getTrackStems from "./tools/get-track-stems";
import listTrackVersions from "./tools/list-track-versions";
import switchActiveVersion from "./tools/switch-active-version";
import generateTrack from "./tools/generate-track";
import getGenerationStatus from "./tools/get-generation-status";
import followUser from "./tools/follow-user";
import getPublicProfile from "./tools/get-public-profile";
import listTrackComments from "./tools/list-track-comments";

// Build the direct Supabase issuer from the project ref. mcp-js validates that
// the configured issuer matches the one the discovery document publishes, so
// this must be the `supabase.co` host — never the `.lovable.cloud` proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "musicverse-ai-mcp",
  title: "MusicVerse AI",
  version: "0.4.0",
  instructions:
    "Tools for MusicVerse AI — an AI music creation platform. " +
    "Public (no login): search_public_tracks, get_track, get_track_stems, list_track_versions, get_public_profile, list_track_comments. " +
    "Authenticated (OAuth, act as the signed-in user): list_my_tracks, list_my_playlists, get_my_profile, get_my_credits, like_track, follow_user, create_playlist, add_track_to_playlist, remove_track_from_playlist, switch_active_version, generate_track (starts a Suno job, consumes credits), get_generation_status (poll a running job). " +
    "See docs/MCP.md in the repo for the full tool reference and usage recipes.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchPublicTracks,
    getTrack,
    getPublicProfile,
    listTrackComments,
    listMyTracks,
    getMyProfile,
    getMyCredits,
    listMyPlaylists,
    likeTrack,
    followUser,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getTrackStems,
    listTrackVersions,
    switchActiveVersion,
    generateTrack,
    getGenerationStatus,
  ],
});

