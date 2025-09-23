export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGroupName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Group name is required' };
  }
  
  if (name.length < 3) {
    return { isValid: false, error: 'Group name must be at least 3 characters long' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Group name must be less than 50 characters' };
  }
  
  return { isValid: true };
};

export const validateGroupDescription = (description: string): { isValid: boolean; error?: string } => {
  if (!description.trim()) {
    return { isValid: false, error: 'Group description is required' };
  }
  
  if (description.length < 10) {
    return { isValid: false, error: 'Group description must be at least 10 characters long' };
  }
  
  if (description.length > 200) {
    return { isValid: false, error: 'Group description must be less than 200 characters' };
  }
  
  return { isValid: true };
};

export const validateTag = (tag: string): { isValid: boolean; error?: string } => {
  if (!tag.trim()) {
    return { isValid: false, error: 'Tag is required' };
  }
  
  if (tag.length < 2) {
    return { isValid: false, error: 'Tag must be at least 2 characters long' };
  }
  
  if (tag.length > 30) {
    return { isValid: false, error: 'Tag must be less than 30 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
    return { isValid: false, error: 'Tag can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'File type not supported. Please upload JPG, PNG, GIF, or WebP images only.' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'File size too large. Please upload images smaller than 10MB.' 
    };
  }
  
  return { isValid: true };
};
