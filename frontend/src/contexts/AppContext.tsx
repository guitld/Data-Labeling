import React, { createContext, useContext, ReactNode } from 'react';
import { User, Image, Group, TagSuggestion, ApprovedTag, TagUpvote } from '../types';

interface AppContextType {
  // Data
  images: Image[];
  groups: Group[];
  tagSuggestions: TagSuggestion[];
  approvedTags: ApprovedTag[];
  tagUpvotes: TagUpvote[];
  availableUsers: string[];
  
  // Loading states
  loading: boolean;
  error: string;
  
  // Actions
  loadData: () => Promise<void>;
  setError: (error: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  value: AppContextType;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, value }) => {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
