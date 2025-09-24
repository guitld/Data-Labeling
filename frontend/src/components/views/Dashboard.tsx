import React, { memo, useMemo } from 'react';
import { User, Image, Group, TagSuggestion, ApprovedTag, View } from '../../types';

interface DashboardProps {
  user: User;
  images: Image[];
  groups: Group[];
  tagSuggestions: TagSuggestion[];
  approvedTags: ApprovedTag[];
  availableUsers: string[];
  onViewChange: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = memo(({
  user,
  images,
  groups,
  tagSuggestions,
  approvedTags,
  availableUsers,
  onViewChange
}) => {
  // Memoize expensive calculations
  const metrics = useMemo(() => {
    const totalImages = images.length;
    const totalGroups = groups.length;
    const totalUsers = availableUsers.length;
    const pendingSuggestionsCount = tagSuggestions.filter(sug => sug.status === 'pending').length;
    const approvedTagsCount = approvedTags.length;
    return {
      totalImages,
      totalGroups,
      totalUsers,
      pendingSuggestionsCount,
      approvedTagsCount
    };
  }, [images.length, groups.length, availableUsers.length, tagSuggestions, approvedTags.length]);

  const activityMetrics = useMemo(() => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentImages = images.filter(img => new Date(img.uploaded_at) >= last7Days).length;
    const recentGroups = groups.filter(group => new Date(group.created_at) >= last7Days).length;
    const recentSuggestions = tagSuggestions.filter(sug => new Date(sug.suggested_at) >= last7Days).length;
    
    return { recentImages, recentGroups, recentSuggestions };
  }, [images, groups, tagSuggestions]);

  const groupDistribution = useMemo(() => {
    return groups.map(group => ({
      name: group.name,
      count: images.filter(img => img.group_id === group.id).length
    })).sort((a, b) => b.count - a.count);
  }, [groups, images]);

  const userActivity = useMemo(() => {
    return availableUsers.map(username => {
      const userImages = images.filter(img => img.uploaded_by === username).length;
      const userSuggestions = tagSuggestions.filter(sug => sug.suggested_by === username).length;
      return {
        username,
        images: userImages,
        suggestions: userSuggestions,
        total: userImages + userSuggestions
      };
    }).sort((a, b) => b.total - a.total);
  }, [availableUsers, images, tagSuggestions]);

  const recentActivity = useMemo(() => {
    return [
      ...images.slice(-5).map(image => ({
        type: 'upload',
        user: image.uploaded_by,
        description: `Uploaded "${image.original_name}"`,
        timestamp: new Date(image.uploaded_at),
        icon: '📤'
      })),
      ...tagSuggestions.slice(-3).map(suggestion => ({
        type: 'tag_suggestion',
        user: suggestion.suggested_by,
        description: `Suggested tag "${suggestion.tag}"`,
        timestamp: new Date(suggestion.suggested_at),
        icon: '🏷️'
      })),
      ...groups.slice(-2).map(group => ({
        type: 'group_activity',
        user: group.created_by,
        description: `Created group "${group.name}"`,
        timestamp: new Date(group.created_at),
        icon: '📁'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }, [images, tagSuggestions, groups]);

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h2>Welcome back, {user?.username}! 👋</h2>
        <p className="welcome-subtitle">
          {user?.role === 'admin' 
            ? 'Here\'s your comprehensive admin dashboard with all the insights you need.'
            : 'Here\'s your personalized dashboard with quick access to your content.'
          }
        </p>
      </div>
      
      {user?.role === 'admin' && (
        <div className="admin-dashboard">
          {/* Key Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">🖼️</div>
              <div className="metric-content">
                <h3>{metrics.totalImages}</h3>
                <p>Total Images</p>
                <span className="metric-trend">
                  +{activityMetrics.recentImages} this week
                </span>
              </div>
            </div>
            
            <div className="metric-card success">
              <div className="metric-icon">📁</div>
              <div className="metric-content">
                <h3>{metrics.totalGroups}</h3>
                <p>Groups</p>
                <span className="metric-trend">
                  +{activityMetrics.recentGroups} this week
                </span>
              </div>
            </div>
            
            <div className="metric-card warning">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <h3>{metrics.totalUsers}</h3>
                <p>Active Users</p>
                <span className="metric-trend">
                  {userActivity.length > 0 ? `${userActivity[0].username} most active` : 'No activity yet'}
                </span>
              </div>
            </div>
            
            <div className="metric-card info">
              <div className="metric-icon">🏷️</div>
              <div className="metric-content">
                <h3>{metrics.approvedTagsCount}</h3>
                <p>Approved Tags</p>
                <span className="metric-trend">
                  +{activityMetrics.recentSuggestions} suggestions this week
                </span>
              </div>
            </div>
          </div>

          {/* Content Distribution */}
          <div className="dashboard-row">
            <div className="dashboard-card">
              <h3>📊 Content Distribution</h3>
              <div className="distribution-chart">
                {groupDistribution.length > 0 ? (
                  groupDistribution.map((group, index) => (
                    <div key={group.name} className="distribution-item">
                      <div className="distribution-bar">
                        <div 
                          className="distribution-fill"
                          style={{ 
                            width: `${(group.count / Math.max(...groupDistribution.map(g => g.count))) * 100}%`,
                            backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                          }}
                        ></div>
                      </div>
                      <div className="distribution-info">
                        <span className="group-name">{group.name}</span>
                        <span className="group-count">{group.count} images</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No groups created yet</p>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h3>👥 User Activity</h3>
              <div className="user-activity-list">
                {userActivity.slice(0, 5).map((user, index) => (
                  <div key={user.username} className="user-activity-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <span className="username">{user.username}</span>
                      <div className="user-stats">
                        <span className="stat">{user.images} images</span>
                        <span className="stat">{user.suggestions} suggestions</span>
                      </div>
                    </div>
                    <div className="activity-score">
                      {user.total}
                    </div>
                  </div>
                ))}
                {userActivity.length === 0 && (
                  <p className="no-data">No user activity yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Stats */}
          <div className="dashboard-row">
            <div className="dashboard-card">
              <h3>⚡ Recent Activity</h3>
              <div className="activity-feed">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <p className="activity-text">
                          <strong>{activity.user}</strong> {activity.description}
                        </p>
                        <span className="activity-time">
                          {activity.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No recent activity</p>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h3>📈 Quick Stats</h3>
              <div className="quick-stats">
                <div className="quick-stat">
                  <div className="stat-label">Pending Reviews</div>
                  <div className="stat-value pending">{metrics.pendingSuggestionsCount}</div>
                </div>
                <div className="quick-stat">
                  <div className="stat-label">Avg Images/Group</div>
                  <div className="stat-value">
                    {metrics.totalGroups > 0 ? Math.round(metrics.totalImages / metrics.totalGroups) : 0}
                  </div>
                </div>
                <div className="quick-stat">
                  <div className="stat-label">Most Active Group</div>
                  <div className="stat-value">
                    {groupDistribution.length > 0 ? groupDistribution[0].name : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>🚀 Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="action-button primary"
            onClick={() => onViewChange('gallery')}
          >
            <span className="action-icon">🖼️</span>
            <span className="action-text">View Gallery</span>
            <span className="action-count">{metrics.totalImages}</span>
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button 
                className="action-button success"
                onClick={() => onViewChange('upload')}
              >
                <span className="action-icon">📤</span>
                <span className="action-text">Upload Images</span>
              </button>
              
              <button 
                className="action-button info"
                onClick={() => onViewChange('groups')}
              >
                <span className="action-icon">📁</span>
                <span className="action-text">Manage Groups</span>
                <span className="action-count">{metrics.totalGroups}</span>
              </button>
              
              <button 
                className="action-button warning"
                onClick={() => onViewChange('tags')}
              >
                <span className="action-icon">🏷️</span>
                <span className="action-text">Manage Tags</span>
                {metrics.pendingSuggestionsCount > 0 && (
                  <span className="action-badge">{metrics.pendingSuggestionsCount}</span>
                )}
              </button>
              
              {metrics.pendingSuggestionsCount > 0 && (
                <button 
                  className="action-button urgent"
                  onClick={() => onViewChange('tag-review')}
                >
                  <span className="action-icon">👆</span>
                  <span className="action-text">Review Tags</span>
                  <span className="action-badge urgent">{metrics.pendingSuggestionsCount}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;