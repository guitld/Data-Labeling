import React, { memo, useMemo } from 'react';
import { Image, Group, ApprovedTag, TagSuggestion, User } from '../../types';
import ImageCard from '../ImageCard';
import { searchImages } from '../../utils/helpers';

interface GalleryProps {
  images: Image[];
  groups: Group[];
  approvedTags: ApprovedTag[];
  tagSuggestions: TagSuggestion[];
  user: User | null;
  selectedGroup: string | null;
  searchQuery: string;
  onGroupSelect: (groupId: string | null) => void;
  onImageClick: (image: Image) => void;
  onDeleteImage: (imageId: string) => void;
}

const Gallery: React.FC<GalleryProps> = memo(({
  images,
  groups,
  approvedTags,
  tagSuggestions,
  user,
  selectedGroup,
  searchQuery,
  onGroupSelect,
  onImageClick,
  onDeleteImage
}) => {
  // Memoize filtered images
  const filteredImages = useMemo(() => {
    let filtered = selectedGroup 
      ? images.filter(img => img.group_id === selectedGroup)
      : images;
    
    // Apply search
    return searchImages(filtered, searchQuery, groups, approvedTags);
  }, [images, selectedGroup, searchQuery, groups, approvedTags]);

  return (
    <div className="gallery">
      <div className="gallery-header">
        {/* Search Info */}
        {searchQuery && (
          <div className="gallery-info">
            <div className="search-info">
              <span className="search-badge">
                🔍 &quot;{searchQuery}&quot; ({filteredImages.length} results)
              </span>
            </div>
          </div>
        )}
        
        <div className="group-selector">
          <button 
            className={`group-folder ${selectedGroup === null ? 'active' : ''}`}
            onClick={() => onGroupSelect(null)}
          >
            📁 All Groups ({images.length})
          </button>
          {groups.map((group) => {
            const groupImages = images.filter(img => img.group_id === group.id);
            return (
              <button 
                key={group.id}
                className={`group-folder ${selectedGroup === group.id ? 'active' : ''}`}
                onClick={() => onGroupSelect(group.id)}
              >
                📁 {group.name} ({groupImages.length})
              </button>
            );
          })}
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <div className="empty-state">
          <h3>No Images in This Group</h3>
          <p>This group doesn&apos;t have any images yet.</p>
        </div>
      ) : (
        <div className="image-grid">
          {filteredImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              groups={groups}
              approvedTags={approvedTags}
              tagSuggestions={tagSuggestions}
              user={user}
              onImageClick={onImageClick}
              onDeleteImage={onDeleteImage}
            />
          ))}
        </div>
      )}
    </div>
  );
});

Gallery.displayName = 'Gallery';

export default Gallery;