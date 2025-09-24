import React, { useState, useEffect } from 'react';
import { Image, Group, ApprovedTag, TagSuggestion, TagUpvote, User } from '../types';
import { aiAPI, tagsAPI } from '../services/api';

interface ImageModalProps {
  image: Image | null;
  groups: Group[];
  approvedTags: ApprovedTag[];
  tagSuggestions: TagSuggestion[];
  user: User | null;
  onClose: () => void;
  onSuggestTag: (imageId: string, tag: string) => Promise<void>;
  onUpvoteTag: (tagId: string) => Promise<void>;
  onApproveTag: (suggestionId: string) => Promise<void>;
  onRejectTag: (suggestionId: string) => Promise<void>;
  suggestingTag: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({
  image,
  groups,
  approvedTags,
  tagSuggestions,
  user,
  onClose,
  onSuggestTag,
  onUpvoteTag,
  onApproveTag,
  onRejectTag,
  suggestingTag
}) => {
  const [newTagText, setNewTagText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [tagUpvotesMap, setTagUpvotesMap] = useState<Record<string, TagUpvote[]>>({});

  // Função para carregar upvotes de uma tag específica
  const loadTagUpvotes = async (tagId: string) => {
    try {
      const response = await tagsAPI.getUpvotes(tagId);
      setTagUpvotesMap(prev => ({
        ...prev,
        [tagId]: response.upvotes
      }));
    } catch (error) {
      console.error('Error loading tag upvotes:', error);
    }
  };

  // Carregar upvotes das tags quando o modal abrir
  useEffect(() => {
    if (image) {
      const imageApprovedTags = approvedTags.filter(tag => tag.image_id === image.id);
      imageApprovedTags.forEach(tag => {
        if (!tagUpvotesMap[tag.id]) {
          loadTagUpvotes(tag.id);
        }
      });
    }
  }, [image, approvedTags, tagUpvotesMap]);

  if (!image) return null;

  const group = groups.find(g => g.id === image.group_id);
  const imageApprovedTags = approvedTags.filter(tag => tag.image_id === image.id);
  const imagePendingSuggestions = tagSuggestions.filter(sug => 
    sug.image_id === image.id && sug.status === 'pending'
  );
  const imageRejectedSuggestions = tagSuggestions.filter(sug => 
    sug.image_id === image.id && sug.status === 'rejected'
  );

  const handleSuggestTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagText.trim()) {
      await onSuggestTag(image.id, newTagText.trim());
      setNewTagText('');
    }
  };

  const handleUpvote = async (tagId: string) => {
    await onUpvoteTag(tagId);
    // Recarregar os upvotes após o upvote
    await loadTagUpvotes(tagId);
  };

  const handleAISuggestion = async () => {
    if (!image || !group) return;
    
    setIsGeneratingAI(true);
    
    try {
      // Coletar tags existentes para evitar repetições
      const approvedTagsList = imageApprovedTags.map(tag => tag.tag);
      const rejectedTagsList = imageRejectedSuggestions.map(sug => sug.tag);
      const pendingTagsList = imagePendingSuggestions.map(sug => sug.tag);
      
      const request = {
        group_name: group.name,
        approved_tags: approvedTagsList,
        rejected_tags: rejectedTagsList,
        pending_tags: pendingTagsList,
        image_name: image.original_name,
        image_url: `http://localhost:8082/uploads/${image.filename}`
      };
      
      const response = await aiAPI.generateTagSuggestion(request);
      
      if (response.success && response.suggestion) {
        setNewTagText(response.suggestion);
      } else {
        console.error('AI suggestion failed:', response.error);
        // Fallback para "teste" se a API falhar
        setNewTagText('teste');
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      // Fallback para "teste" em caso de erro
      setNewTagText('teste');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const handleRemoveApprovedTag = async (tagId: string) => {
    try {
      await tagsAPI.deleteApproved(tagId);
      setTagUpvotesMap(prev => {
        const updated = { ...prev };
        delete updated[tagId];
        return updated;
      });
    } catch (error) {
      console.error('Error removing approved tag:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>
        
        <div className="modal-layout">
          <div className="modal-image-container">
            <img
              src={`http://localhost:8082/uploads/${image.filename}?t=${Date.now()}`}
              alt={image.original_name}
              className="modal-image-large"
            />
          </div>
          
          <div className="modal-sidebar">
            <div className="image-details">
              <h3>{image.original_name}</h3>
              <p><strong>Uploaded by:</strong> {image.uploaded_by}</p>
              <p><strong>Date:</strong> {new Date(image.uploaded_at).toLocaleDateString()}</p>
              <p><strong>Group:</strong> {group?.name || 'Unknown'}</p>
            </div>

        <div className="tag-suggestion-box">
          <h4>Suggest a Tag</h4>
          <form onSubmit={handleSuggestTag}>
            <div className="tag-input-row">
              <input
                type="text"
                className="form-input"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="Enter tag suggestion..."
                required
              />
              <div className="ai-tooltip-container">
                <button
                  type="button"
                  className={`ai-suggestion-btn-small ${isGeneratingAI ? 'loading' : ''}`}
                  onClick={handleAISuggestion}
                  disabled={isGeneratingAI || suggestingTag}
                >
                  {isGeneratingAI ? (
                    <div className="ai-loading-spinner">
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                    </div>
                  ) : (
                    '✨'
                  )}
                </button>
                <div className="ai-tooltip">
                  <div className="ai-tooltip-content">
                    <div className="ai-tooltip-icon">ℹ️</div>
                    <div className="ai-tooltip-text">
                      <strong>IA:</strong> Agora você pode somente revisar as tags geradas por IA, basta clicar no ícone.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="suggest-button-row">
              <button
                type="submit"
                className="login-button"
                disabled={suggestingTag || !newTagText.trim()}
              >
                {suggestingTag ? 'Suggesting...' : 'Suggest Tag'}
              </button>
            </div>
          </form>
        </div>

            <div className="all-tags-section">
              <h4>Approved Tags</h4>
              {imageApprovedTags.length > 0 ? (
                <div className="tag-list">
                  {imageApprovedTags
                    .sort((a, b) => {
                      const aUpvotes = tagUpvotesMap[a.id] || [];
                      const bUpvotes = tagUpvotesMap[b.id] || [];
                      const aUpvoted = aUpvotes.some(upvote => upvote.user_id === user?.username);
                      const bUpvoted = bUpvotes.some(upvote => upvote.user_id === user?.username);

                      if (aUpvoted && !bUpvoted) return -1;
                      if (!aUpvoted && bUpvoted) return 1;
                      return bUpvotes.length - aUpvotes.length;
                    })
                    .map(tag => {
                      const tagUpvotes = tagUpvotesMap[tag.id] || [];
                      const hasUpvoted = tagUpvotes.some(upvote => upvote.user_id === user?.username);
                      return (
                        <div key={tag.id} className="tag-item-approved">
                          <div className={`upvote-section ${hasUpvoted ? 'upvoted' : 'not-upvoted'}`} onClick={() => handleUpvote(tag.id)}>
                            <span className="upvote-count">{tagUpvotes.length}</span>
                          </div>
                          <span className="tag-text">{tag.tag}</span>
                          {isAdmin && (
                            <button
                              className="remove-tag-button"
                              title="Remove approved tag"
                              onClick={() => handleRemoveApprovedTag(tag.id)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="no-tags">No approved tags yet.</p>
              )}
            </div>

            {user?.role === 'admin' && imagePendingSuggestions.length > 0 && (
              <div className="tags-section">
                <h4>Pending Suggestions</h4>
                <div className="tag-list">
                  {imagePendingSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="tag-item">
                      <span className="tag-text">{suggestion.tag}</span>
                      <div className="tag-actions">
                        <button
                          className="approve-button-small"
                          onClick={() => onApproveTag(suggestion.id)}
                        >
                          ✓
                        </button>
                        <button
                          className="reject-button-small"
                          onClick={() => onRejectTag(suggestion.id)}
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.role === 'admin' && imageRejectedSuggestions.length > 0 && (
              <div className="tags-section">
                <h4 className="rejected-title">Rejected Suggestions</h4>
                <div className="tag-list">
                  {imageRejectedSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="tag-item-rejected">
                      <span className="tag-text">{suggestion.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

