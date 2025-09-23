import React, { useState, useEffect } from 'react';
import { TagSuggestion, Image, Group, User } from '../../types';

interface TagReviewProps {
  tagSuggestions: TagSuggestion[];
  images: Image[];
  groups: Group[];
  user: User;
  onApproveTag: (suggestionId: string) => void;
  onRejectTag: (suggestionId: string) => void;
  onBackToTags: () => void;
}

const TagReview: React.FC<TagReviewProps> = ({
  tagSuggestions,
  images,
  groups,
  user,
  onApproveTag,
  onRejectTag,
  onBackToTags
}) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewingTag, setReviewingTag] = useState(false);

  const pendingSuggestionsForReview = tagSuggestions.filter(sug => sug.status === 'pending');
  const currentSuggestion = pendingSuggestionsForReview[currentReviewIndex];
  const currentImage = currentSuggestion ? images.find(img => img.id === currentSuggestion.image_id) : null;

  // Reset review index when it goes beyond available suggestions
  useEffect(() => {
    if (currentReviewIndex >= pendingSuggestionsForReview.length && pendingSuggestionsForReview.length > 0) {
      setCurrentReviewIndex(0);
    }
  }, [currentReviewIndex, pendingSuggestionsForReview.length]);

  const handleReviewApprove = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;
    
    setReviewingTag(true);
    try {
      await onApproveTag(suggestionId);
      // Move to next suggestion, but don't go beyond the array
      setCurrentReviewIndex(prev => {
        const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
        return Math.min(prev + 1, pendingSuggestions.length - 1);
      });
    } catch (error) {
      console.error('Failed to approve tag:', error);
    } finally {
      setReviewingTag(false);
    }
  };

  const handleReviewReject = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;
    
    setReviewingTag(true);
    try {
      await onRejectTag(suggestionId);
      // Move to next suggestion, but don't go beyond the array
      setCurrentReviewIndex(prev => {
        const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
        return Math.min(prev + 1, pendingSuggestions.length - 1);
      });
    } catch (error) {
      console.error('Failed to reject tag:', error);
    } finally {
      setReviewingTag(false);
    }
  };

  const handleSkip = () => {
    setCurrentReviewIndex(prev => {
      const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
      return Math.min(prev + 1, pendingSuggestions.length - 1);
    });
  };

  if (pendingSuggestionsForReview.length === 0) {
    return (
      <div className="tag-review-view">
        <div className="review-empty-state">
          <h2>🎉 All Done!</h2>
          <p>No pending tag suggestions to review.</p>
          <button 
            className="login-button"
            onClick={onBackToTags}
          >
            Back to Tags
          </button>
        </div>
      </div>
    );
  }

  if (!currentSuggestion || !currentImage) {
    return (
      <div className="tag-review-view">
        <div className="review-error-state">
          <h2>Error</h2>
          <p>No more suggestions to review.</p>
          <button 
            className="login-button"
            onClick={() => {
              setCurrentReviewIndex(0);
              onBackToTags();
            }}
          >
            Back to Tags
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tag-review-view">
      <div className="review-header">
        <h2>Tag Review</h2>
        <div className="review-progress">
          {currentReviewIndex + 1} of {pendingSuggestionsForReview.length}
        </div>
      </div>

      <div className="review-card-modern">
        <div className="review-image-container">
          <img
            src={`http://localhost:8082/uploads/${currentImage.filename}?t=${Date.now()}`}
            alt={currentImage.original_name}
            className="review-image"
          />
          
          <div className="tag-overlay">
            <div className="group-info-discrete">
              {groups.find(g => g.id === currentImage.group_id)?.name || 'Unknown'}
            </div>
            <div className="tag-modern">{currentSuggestion.tag}</div>
          </div>
        </div>

        <div className="review-actions-modern">
          <button
            className="action-btn-modern reject-btn"
            onClick={() => handleReviewReject(currentSuggestion.id)}
            disabled={reviewingTag}
          >
            <span className="btn-icon">✕</span>
          </button>
          
          <button
            className="action-btn-modern approve-btn"
            onClick={() => handleReviewApprove(currentSuggestion.id)}
            disabled={reviewingTag}
          >
            <span className="btn-icon">✓</span>
          </button>
        </div>

        <div className="review-footer-modern">
          <button 
            className="skip-btn-modern"
            onClick={handleSkip}
            disabled={reviewingTag}
          >
            Skip
          </button>
          <button 
            className="back-btn-modern"
            onClick={onBackToTags}
          >
            Back to Tags
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagReview;
