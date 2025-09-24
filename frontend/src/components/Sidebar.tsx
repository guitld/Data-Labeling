import React from 'react';
import { User, View } from '../types';

interface SidebarProps {
  user: User;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  pendingSuggestionsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
  pendingSuggestionsCount
}) => {
  return (
    <nav className="sidebar open">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🖼️</span>
          <span className="logo-text">Image Labeling System</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className={`user-role role-${user?.role || 'user'}`}>
              {user?.role || 'user'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Browse</div>
            <button 
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'gallery' ? 'active' : ''}`}
              onClick={() => onViewChange('gallery')}
            >
              <span className="nav-icon">🖼️</span>
              <span className="nav-label">Gallery</span>
            </button>
          </div>
          
          {user?.role === 'admin' && (
            <div className="nav-section">
              <div className="nav-section-title">Admin Tools</div>
              <button 
                className={`nav-item ${currentView === 'upload' ? 'active' : ''}`}
                onClick={() => onViewChange('upload')}
              >
                <span className="nav-icon">📤</span>
                <span className="nav-label">Upload</span>
              </button>
              <button 
                className={`nav-item ${currentView === 'groups' ? 'active' : ''}`}
                onClick={() => onViewChange('groups')}
              >
                <span className="nav-icon">📁</span>
                <span className="nav-label">Groups</span>
              </button>
              <button 
                className={`nav-item ${currentView === 'tags' ? 'active' : ''}`}
                onClick={() => onViewChange('tags')}
              >
                <span className="nav-icon">🏷️</span>
                <span className="nav-label">Tags</span>
              </button>
              
              <button 
                className={`nav-item ${currentView === 'tag-review' ? 'active' : ''}`}
                onClick={() => onViewChange('tag-review')}
              >
                <span className="nav-icon">👆</span>
                <span className="nav-label">
                  Tag Review
                  {pendingSuggestionsCount > 0 && (
                    <span className="nav-badge">
                      {pendingSuggestionsCount}
                    </span>
                  )}
                </span>
              </button>
              
              <button 
                className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
                onClick={() => onViewChange('chat')}
              >
                <span className="nav-icon">🤖</span>
                <span className="nav-label">AI Insights</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button 
          className="logout-btn"
          onClick={onLogout}
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;

