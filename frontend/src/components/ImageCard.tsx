import React from 'react';
import { Image, Group, ApprovedTag, TagSuggestion, User } from '../types';

interface ImageCardProps {
  image: Image;
  groups: Group[];
  approvedTags: ApprovedTag[];
  tagSuggestions: TagSuggestion[];
  user: User | null;
  onImageClick: (image: Image) => void;
  onDeleteImage: (imageId: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  groups,
  approvedTags,
  tagSuggestions,
  user,
  onImageClick,
  onDeleteImage
}) => {
  const group = groups.find(g => g.id === image.group_id);
  const imageTags = approvedTags.filter(tag => tag.image_id === image.id);
  const imageSuggestions = tagSuggestions.filter(sug => sug.image_id === image.id);

  return (
    <div className="image-item">
      <div className="image-container" onClick={() => onImageClick(image)}>
        <img 
          src={`http://localhost:8082/uploads/${image.filename}`} 
          alt={image.original_name}
          className="gallery-image"
        />
        <div className="image-overlay">
          <span className="view-icon">👁</span>
          {user?.role === 'admin' && (
            <button
              className="delete-image-btn-gallery"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteImage(image.id);
              }}
              title="Delete image"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="image-info">
        <p className="image-name">{image.original_name}</p>
        <p className="image-date">{new Date(image.uploaded_at).toLocaleDateString()}</p>
        <p className="image-group">
          {group?.name || 'Unknown Group'}
        </p>
        {imageTags.length > 0 && (
          <div className="image-tags">
            {imageTags.slice(0, 3).map(tag => (
              <span key={tag.id} className="tag-mini">
                {tag.tag}
              </span>
            ))}
            {imageTags.length > 3 && (
              <span className="tag-more">+{imageTags.length - 3}</span>
            )}
          </div>
        )}
        {imageSuggestions.filter(s => s.status === 'pending').length > 0 && (
          <div className="pending-tags">
            <span className="pending-count">
              {imageSuggestions.filter(s => s.status === 'pending').length} pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCard;

