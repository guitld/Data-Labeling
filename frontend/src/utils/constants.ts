export const API_BASE_URL = 'http://localhost:8082';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  GALLERY: '/gallery',
  UPLOAD: '/upload',
  GROUPS: '/groups',
  TAGS: '/tags',
  TAG_REVIEW: '/tag-review',
  GROUP_DETAIL: '/group-detail'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const TAG_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
} as const;

export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10
} as const;

export const PAGINATION = {
  GROUPS_PER_PAGE: 6,
  IMAGES_PER_PAGE: 12,
  TAGS_PER_PAGE: 20
} as const;

export const REFRESH_INTERVALS = {
  DATA_REFRESH: 5000, // 5 seconds
  DEBOUNCE_SEARCH: 300 // 300ms
} as const;

export const VALIDATION_RULES = {
  GROUP_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  },
  GROUP_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 200
  },
  TAG: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30
  },
  PASSWORD: {
    MIN_LENGTH: 6
  }
} as const;
