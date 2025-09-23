import { Image, Group, TagSuggestion, ApprovedTag } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateString);
};

export const searchImages = (
  images: Image[], 
  query: string, 
  groups: Group[], 
  approvedTags: ApprovedTag[]
): Image[] => {
  if (!query.trim()) return images;
  
  const lowercaseQuery = query.toLowerCase();
  return images.filter(image => {
    // Search by image name
    if (image.original_name.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Search by group name
    const group = groups.find(g => g.id === image.group_id);
    if (group && group.name.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Search by uploaded by
    if (image.uploaded_by.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Search by tags
    const imageTags = approvedTags.filter(tag => tag.image_id === image.id);
    if (imageTags.some(tag => tag.tag.toLowerCase().includes(lowercaseQuery))) return true;
    
    return false;
  });
};

export const sortImages = (images: Image[], sortBy: 'name' | 'date' | 'group'): Image[] => {
  return [...images].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.original_name.localeCompare(b.original_name);
      case 'date':
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      case 'group':
        return a.group_id.localeCompare(b.group_id);
      default:
        return 0;
    }
  });
};

export const filterImagesByGroup = (images: Image[], groupId: string | null): Image[] => {
  if (!groupId) return images;
  return images.filter(img => img.group_id === groupId);
};

export const getImageTags = (imageId: string, approvedTags: ApprovedTag[]): ApprovedTag[] => {
  return approvedTags.filter(tag => tag.image_id === imageId);
};

export const getImageSuggestions = (imageId: string, tagSuggestions: TagSuggestion[]): TagSuggestion[] => {
  return tagSuggestions.filter(suggestion => suggestion.image_id === imageId);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
