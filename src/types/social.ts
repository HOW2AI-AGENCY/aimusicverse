// Social Types - Sprint 011 Task T013
// Types for following system and social interactions

export type FollowStatus = 'active' | 'blocked';

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  status: FollowStatus;
  createdAt: string;
}

export interface FollowerItem {
  id: string;
  userId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  isVerified: boolean;
  bio?: string;
  followedAt: string;
  isFollowingBack: boolean; // Does the current user follow them back?
}

export interface FollowingItem {
  id: string;
  userId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  isVerified: boolean;
  bio?: string;
  followedAt: string;
  followsYouBack: boolean; // Do they follow the current user back?
}

export interface FollowersList {
  followers: FollowerItem[];
  total: number;
  hasMore: boolean;
}

export interface FollowingList {
  following: FollowingItem[];
  total: number;
  hasMore: boolean;
}

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean; // Is current user following this profile?
  isFollower: boolean;  // Does this profile follow current user?
}

export interface FollowMutationInput {
  followingId: string;
}

export interface UnfollowMutationInput {
  followingId: string;
}
