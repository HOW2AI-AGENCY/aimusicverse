// Comment Types - Sprint 011 Task T014
// Types for comment system with threading and mentions

export interface Mention {
  userId: string;
  username: string;
  displayName?: string;
  startIndex: number;
  endIndex: number;
}

export interface Comment {
  id: string;
  trackId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  likesCount: number;
  replyCount: number;
  isEdited: boolean;
  isModerated: boolean;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithUser extends Comment {
  user: {
    id: string;
    userId: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  mentions?: Mention[];
  isLiked?: boolean; // Has current user liked this comment?
}

export interface CommentThread extends CommentWithUser {
  replies: CommentWithUser[];
  hasMoreReplies: boolean;
  depth: number; // Thread depth (0 = top-level, max 5)
}

export interface CommentFormData {
  content: string;
  parentCommentId?: string;
  mentions?: Mention[];
}

export interface CommentCreateInput {
  track_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface CommentUpdateInput {
  content: string;
}

export interface CommentListParams {
  trackId: string;
  parentCommentId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export interface CommentListResponse {
  comments: CommentThread[];
  total: number;
  hasMore: boolean;
}
