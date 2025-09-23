import React from 'react';
import { TagSuggestion, ApprovedTag, TagUpvote, User, Image, Group } from '../../types';

interface TagsProps {
  tagSuggestions: TagSuggestion[];
  approvedTags: ApprovedTag[];
  tagUpvotes: TagUpvote[];
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
  tagUpvotes,
  images,
  groups,
  user,
  onApproveTag,
  onRejectTag,
  onUpvoteTag,
  onImageClick
}) => {
  const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
  const approvedSuggestions = tagSuggestions.filter(sug => sug.status === 'approved');
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
                        src={`http://localhost:8082/uploads/${image.filename}`} 
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
              .sort((a, b) => {
                const aUpvoted = tagUpvotes.some(upvote => 
                  upvote.tag_id === a.id && upvote.user_id === user?.username
                );
                const bUpvoted = tagUpvotes.some(upvote => 
                  upvote.tag_id === b.id && upvote.user_id === user?.username
                );
                
                // Prioritize upvoted tags first
                if (aUpvoted && !bUpvoted) return -1;
                if (!aUpvoted && bUpvoted) return 1;
                
                // If both have same upvote status, sort by upvote count (descending)
                return b.upvotes - a.upvotes;
              })
              .map(tag => {
                const image = images.find(img => img.id === tag.image_id);
                const hasUpvoted = tagUpvotes.some(upvote => 
                  upvote.tag_id === tag.id && upvote.user_id === user?.username
                );
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
