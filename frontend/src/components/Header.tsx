import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  error: string;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  isRefreshing,
  searchQuery,
  onSearchChange,
  error
}) => {
  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'gallery': return 'Image Gallery';
      case 'upload': return 'Upload Images';
      case 'groups': return 'Manage Groups';
      case 'tags': return 'Manage Tags';
      case 'tag-review': return 'Tag Review';
      case 'group-detail': return 'Group Details';
      default: return '';
    }
  };

  return (
    <div className="content-header">
      <div className="header-top">
        <h1 className="page-title">
          {getPageTitle()}
          {isRefreshing && <span className="refresh-indicator">🔄</span>}
        </h1>
        
        {/* Search Bar - Only in Gallery */}
        {currentView === 'gallery' && (
          <div className="global-search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="global-search-input"
                placeholder="Search images, tags, groups..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Header;

