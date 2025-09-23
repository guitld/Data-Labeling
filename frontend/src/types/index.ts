export interface User {
  username: string;
  role: string;
}

export interface Image {
  id: string;
  filename: string;
  original_name: string;
  group_id: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  created_at: string;
  created_by: string;
}

export interface TagSuggestion {
  id: string;
  image_id: string;
  tag: string;
  suggested_by: string;
  suggested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface ApprovedTag {
  id: string;
  image_id: string;
  tag: string;
  approved_by: string;
  approved_at: string;
  upvotes: number;
}

export interface TagUpvote {
  id: string;
  tag_id: string;
  user_id: string;
  upvoted_at: string;
}

export type View = 'dashboard' | 'gallery' | 'upload' | 'groups' | 'tags' | 'group-detail' | 'tag-review';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  username: string;
  role: string;
  message: string;
}

