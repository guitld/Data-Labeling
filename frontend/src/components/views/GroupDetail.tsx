import React, { useState, useEffect } from 'react';
import { Group, Image, ApprovedTag, User } from '../../types';
import { groupsAPI, usersAPI, imagesAPI } from '../../services/api';
import ImageCard from '../ImageCard';

interface GroupDetailProps {
  group: Group;
  images: Image[];
  approvedTags: ApprovedTag[];
  user: User;
  onBackToGroups: () => void;
  onImageClick: (image: Image) => void;
  onDeleteImage: (imageId: string) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  images,
  approvedTags,
  user,
  onBackToGroups,
  onImageClick,
  onDeleteImage,
  onError,
  onSuccess
}) => {
  const [groupImages, setGroupImages] = useState<Image[]>([]);
  const [groupTags, setGroupTags] = useState<ApprovedTag[]>([]);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Form states
  const [uploadGroupFile, setUploadGroupFile] = useState<File | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  
  // Loading states
  const [uploadingToGroup, setUploadingToGroup] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Load group-specific data
  useEffect(() => {
    // Load images for this group
    const groupImages = images.filter(img => img.group_id === group.id);
    setGroupImages(groupImages);
    
    // Load tags for this group
    const groupTags = approvedTags.filter(tag => 
      tag.image_id && groupImages.some(img => img.id === tag.image_id)
    );
    setGroupTags(groupTags);
  }, [group.id, images, approvedTags]);

  const handleUploadToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadGroupFile || !user) {
      onError('Please select a file and make sure you are logged in');
      return;
    }

    setUploadingToGroup(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadGroupFile);
      formData.append('group_id', group.id);
      formData.append('uploaded_by', user.username);

      const response = await imagesAPI.upload(formData);

      if (response.success) {
        setUploadGroupFile(null);
        setShowAddImageModal(false);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onSuccess();
      } else {
        onError(response.error || 'Failed to upload image');
      }
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingToGroup(false);
    }
  };

  const handleAddUserToGroup = async (username?: string) => {
    const userToAdd = username || newUserName.trim();
    if (!userToAdd) {
      onError('Please select a user');
      return;
    }

    setAddingUser(true);
    try {
      const response = await groupsAPI.addUser({
        group_id: group.id,
        username: userToAdd
      });

      if (response.success) {
        setNewUserName('');
        setShowUserDropdown(false);
        onSuccess();
      } else {
        onError(response.error || 'Failed to add user to group');
      }
    } catch (error: any) {
      console.error('Error adding user to group:', error);
      onError(error.response?.data?.error || 'Failed to add user to group');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserFromGroup = async (username: string) => {
    try {
      console.log('Removing user from group:', { groupId: group.id, username });
      const response = await groupsAPI.removeUser({
        group_id: group.id,
        username: username
      });
        
      console.log('Remove user response:', response);
      if (response.success) {
        console.log('User removed successfully, calling onSuccess');
        onSuccess();
      } else {
        onError(response.error || 'Failed to remove user from group');
      }
    } catch (error: any) {
      console.error('Error removing user from group:', error);
      onError(error.response?.data?.error || 'Failed to remove user from group');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      console.log('All users from API:', response);
      const usersNotInGroup = response.filter(user => !group.members.includes(user));
      console.log('Users not in group:', usersNotInGroup);
      console.log('Group members:', group.members);
      setAvailableUsers(usersNotInGroup);
      setFilteredUsers(usersNotInGroup); // Show all users initially
    } catch (error) {
      console.error('Failed to load users:', error);
      onError('Failed to load users list');
    }
  };

  const handleUserInputChange = (value: string) => {
    setNewUserName(value);
    if (value.trim()) {
      const filtered = availableUsers.filter(user => 
        user.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    } else {
      setFilteredUsers(availableUsers); // Show all users when empty
      setShowUserDropdown(true);
    }
  };

  const handleUserSelect = (username: string) => {
    setNewUserName(username);
    setShowUserDropdown(false);
    handleAddUserToGroup(username);
  };

  return (
    <div className="group-detail-view">
      <div className="group-detail-header">
        <button 
          className="back-button"
          onClick={onBackToGroups}
        >
          ← Back to Groups
        </button>
        <div className="group-detail-title">
          <h2>{group.name}</h2>
          <p className="group-detail-description">{group.description}</p>
        </div>
        <button 
          className="add-image-button"
          onClick={() => setShowAddImageModal(true)}
        >
          + Add Images
        </button>
      </div>

      <div className="group-detail-content">
        <div className="group-sidebar">
          <div className="group-members-section">
            <h3>Members ({group.members.length})</h3>
            <div className="members-list">
              {group.members.map((member, index) => (
                <div key={index} className="member-item">
                  <span className="member-name">{member}</span>
                  {user?.role === 'admin' && member !== 'admin' && (
                    <button
                      className="remove-member-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveUserFromGroup(member);
                      }}
                      title="Remove user"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {user?.role === 'admin' && (
              <div className="add-member-section">
                <h4>Add New Member</h4>
                <div className="user-search-container">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="user-search-input"
                      placeholder="Search users to add..."
                      value={newUserName}
                      onChange={(e) => handleUserInputChange(e.target.value)}
                      onFocus={() => {
                        if (availableUsers.length === 0) {
                          loadAvailableUsers();
                        }
                        setShowUserDropdown(true);
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicks
                        setTimeout(() => setShowUserDropdown(false), 200);
                      }}
                    />
                    <div className="search-icon">🔍</div>
                  </div>
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      {availableUsers.length === 0 ? (
                        <div className="user-dropdown-item no-results">
                          <span>No users available to add</span>
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((username) => (
                          <div
                            key={username}
                            className="user-dropdown-item"
                            onClick={() => handleUserSelect(username)}
                          >
                            <span className="user-avatar-small">👤</span>
                            <span className="username">{username}</span>
                          </div>
                        ))
                      ) : (
                        <div className="user-dropdown-item no-results">
                          <span>No users found matching &quot;{newUserName}&quot;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {addingUser && (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <span>Adding user...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="group-tags-section">
            <h3>Tags ({groupTags.length})</h3>
            <div className="tags-list">
              {groupTags.length > 0 ? (
                groupTags.map((tag) => (
                  <div key={tag.id} className="tag-item-approved">
                    <span className="tag-text">{tag.tag}</span>
                    <span className="upvote-count">{tag.upvotes}</span>
                  </div>
                ))
              ) : (
                <p className="no-tags">No tags yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="group-images-section">
          <div className="images-header">
            <h3>Images ({groupImages.length})</h3>
          </div>
          <div className="group-images-grid">
            {groupImages.length > 0 ? (
              groupImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  groups={[group]}
                  approvedTags={approvedTags}
                  tagSuggestions={[]}
                  user={user}
                  onImageClick={onImageClick}
                  onDeleteImage={onDeleteImage}
                />
              ))
            ) : (
              <div className="empty-images">
                <p>No images in this group yet</p>
                <button 
                  className="add-first-image-btn"
                  onClick={() => setShowAddImageModal(true)}
                >
                  + Add First Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Image Modal */}
      {showAddImageModal && (
        <div className="modal-overlay" onClick={() => setShowAddImageModal(false)}>
          <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowAddImageModal(false)}
            >
              ×
            </button>
            
            <div className="upload-section">
              <h3>Add Image to {group.name}</h3>
              <form onSubmit={handleUploadToGroup}>
                <div className="form-group">
                  <label className="form-label">Select Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => setUploadGroupFile(e.target.files?.[0] || null)}
                    required
                  />
                  {uploadGroupFile && (
                    <div className="file-preview">
                      <p><strong>Selected:</strong> {uploadGroupFile.name}</p>
                      <p><strong>Size:</strong> {(uploadGroupFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
                
                <div className="modal-save-section">
                  <button 
                    type="button"
                    className="login-button"
                    onClick={() => {
                      setShowAddImageModal(false);
                      setUploadGroupFile(null);
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="save-changes-button"
                    disabled={uploadingToGroup || !uploadGroupFile}
                  >
                    {uploadingToGroup ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupDetail;
