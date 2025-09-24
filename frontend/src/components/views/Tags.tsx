import React from 'react';
import { TagSuggestion, ApprovedTag, User, Image, Group } from '../../types';
import { UPLOADS_BASE_URL } from '../../config';

interface TagsProps {
  tagSuggestions: TagSuggestion[];
  approvedTags: ApprovedTag[];
  images: Image[];
  groups: Group[];
  user: User;
  onApproveTag: (suggestionId: string) => void;
  onRejectTag: (suggestionId: string) => void;
  onUpvoteTag: (tagId: string) => void;
  onImageClick: (image: Image) => void;
}

const Tags: React.FC<TagsProps> = ({
  tagSuggestions,
  approvedTags,
  images,
  groups,
  user,
  onApproveTag,
  onRejectTag,
  onUpvoteTag,
  onImageClick
}) => {
  const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
  const rejectedSuggestions = tagSuggestions.filter(sug => sug.status === 'rejected');

  return (
    <div className="tags-view">
      <h2>{user?.role === 'admin' ? 'Manage Tags' : 'View Tags'}</h2>
      
      {/* Pending Suggestions */}
      <div className="tags-section">
        <h3>Pending Suggestions ({pendingSuggestions.length})</h3>
        {pendingSuggestions.length > 0 ? (
          <div className="suggestions-grid">
            {pendingSuggestions.map(suggestion => {
              const image = images.find(img => img.id === suggestion.image_id);
              return (
                <div key={suggestion.id} className="suggestion-card-minimal">
                  <div 
                    className="suggestion-image-minimal"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (image) {
                        onImageClick(image);
                      }
                    }}
                  >
                    {image ? (
                      <img 
                        src={`${UPLOADS_BASE_URL}/${image.filename}?t=${Date.now()}`} 
                        alt={image.original_name}
                        className="suggestion-preview-minimal"
                      />
                    ) : (
                      <div className="no-image-minimal">No Image</div>
                    )}
                    <div className="group-badge">
                      {image ? groups.find(g => g.id === image.group_id)?.name || 'Unknown Group' : 'No Image'}
                    </div>
                    <button 
                      className="view-image-btn-minimal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (image) {
                          onImageClick(image);
                        }
                      }}
                      title="View image"
                    >
                      👁
                    </button>
                  </div>
                  <div className="suggestion-content-minimal">
                    <div className="tag-text-minimal">{suggestion.tag}</div>
                    <div className="suggestion-meta-minimal">
                      Suggested by {suggestion.suggested_by} • {new Date(suggestion.suggested_at).toLocaleDateString()}
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="suggestion-actions-minimal">
                      <button 
                        className="action-btn approve-minimal"
                        onClick={() => onApproveTag(suggestion.id)}
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button 
                        className="action-btn reject-minimal"
                        onClick={() => onRejectTag(suggestion.id)}
                        title="Reject"
                      >
                        ✗
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No pending suggestions.</p>
          </div>
        )}
      </div>

      {/* Approved Tags */}
      <div className="tags-section">
        <h3>Approved Tags ({approvedTags.length})</h3>
        {approvedTags.length > 0 ? (
          <div className="tag-list">
            {approvedTags
              .sort((a, b) => b.upvotes - a.upvotes)
              .map(tag => {
                const image = images.find(img => img.id === tag.image_id);
                return (
                  <div key={tag.id} className="tag-item-minimal">
                    <div className="tag-text-minimal">{tag.tag}</div>
                    <div className="vote-count-minimal" onClick={() => onUpvoteTag(tag.id)}>
                      {tag.upvotes}
                    </div>
                    <div className="tag-meta">
                      <small>
                        {image?.original_name} • {image ? groups.find(g => g.id === image.group_id)?.name || 'Unknown Group' : 'No Image'} • {new Date(tag.approved_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No approved tags yet.</p>
          </div>
        )}
      </div>

      {/* Rejected Suggestions */}
      <div className="tags-section">
        <h3>Rejected Suggestions ({rejectedSuggestions.length})</h3>
        {rejectedSuggestions.length > 0 ? (
          <div className="tag-list">
            {rejectedSuggestions.map(suggestion => (
              <div key={suggestion.id} className="tag-item-rejected">
                <span className="tag-text">{suggestion.tag}</span>
                <div className="tag-meta">
                  <small>
                    Rejected by {suggestion.reviewed_by} • {new Date(suggestion.reviewed_at || '').toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No rejected suggestions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
