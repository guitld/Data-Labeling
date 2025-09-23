import React, { useState } from 'react';
import { Group, User } from '../../types';
import { imagesAPI } from '../../services/api';

interface UploadProps {
  groups: Group[];
  user: User;
  onUploadSuccess: () => void;
  onError: (error: string) => void;
}

const Upload: React.FC<UploadProps> = ({
  groups,
  user,
  onUploadSuccess,
  onError
}) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadGroup, setUploadGroup] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentGroupPage, setCurrentGroupPage] = useState(0);
  const groupsPerPage = 6;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadGroup || !user) return;

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('group_id', uploadGroup);
    formData.append('uploaded_by', user.username);

    try {
      const response = await imagesAPI.upload(formData);
      
      if (response.success) {
        setUploadFile(null);
        setUploadGroup('');
        setUploadProgress(0);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onUploadSuccess();
      } else {
        onError(response.error || 'Upload failed');
      }
    } catch (error: any) {
      onError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
  };

  const handleGroupSelect = (groupId: string) => {
    setUploadGroup(groupId);
  };

  const handleCancel = () => {
    setUploadFile(null);
    setUploadGroup('');
    setUploadProgress(0);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="upload-view-modern">
      <div className="upload-header">
        <h2>📤 Upload Images</h2>
        <p className="upload-subtitle">Share your images with the team and organize them by groups</p>
      </div>

      <div className="upload-main">
        <div className="upload-section">
          <h3>🎯 Choose Destination Group</h3>
          <div className="group-selection">
            <div className="group-selection-container">
              <div className="group-grid">
                {groups
                  .slice(currentGroupPage * groupsPerPage, (currentGroupPage + 1) * groupsPerPage)
                  .map((group) => {
                    const groupImages = groups.filter(g => g.id === group.id);
                    return (
                      <div
                        key={group.id}
                        className={`group-option ${uploadGroup === group.id ? 'selected' : ''}`}
                        onClick={() => handleGroupSelect(group.id)}
                      >
                        <div className="group-icon">📁</div>
                        <div className="group-info">
                          <h4>{group.name}</h4>
                          <p>{group.description}</p>
                          <span className="group-count">{groupImages.length} images</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {groups.length > groupsPerPage && (
                <div className="group-pagination">
                  <button
                    className="pagination-btn prev"
                    onClick={() => setCurrentGroupPage(Math.max(0, currentGroupPage - 1))}
                    disabled={currentGroupPage === 0}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    <span>
                      Page {currentGroupPage + 1} of {Math.ceil(groups.length / groupsPerPage)}
                    </span>
                    <span className="pagination-count">
                      ({groups.length} total groups)
                    </span>
                  </div>
                  
                  <button
                    className="pagination-btn next"
                    onClick={() => setCurrentGroupPage(Math.min(Math.ceil(groups.length / groupsPerPage) - 1, currentGroupPage + 1))}
                    disabled={currentGroupPage >= Math.ceil(groups.length / groupsPerPage) - 1}
                  >
                    Next →
                  </button>
                </div>
              )}

              {groups.length === 0 && (
                <div className="no-groups">
                  <p>No groups available. Create a group first!</p>
                  <button 
                    className="create-group-btn"
                    onClick={() => {/* TODO: Navigate to groups */}}
                  >
                    Create Group
                  </button>
                </div>
              )}
            </div>
          </div>
        
          <div className="upload-dropzone">
            <div className="dropzone-content">
              <div className="dropzone-icon">🖼️</div>
              <h4>Drop your images here</h4>
              <p>or click to browse files</p>
              <div className="supported-formats">
                <span>Supports: JPG, JPEG, PNG, GIF, WebP, JFIF, BMP, TIFF</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                required
              />
            </div>
            
            {uploadFile && (
              <div className="image-preview-container">
                <img
                  src={URL.createObjectURL(uploadFile)}
                  alt="Preview"
                  className="image-preview"
                />
                <div className="preview-overlay">
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => setUploadFile(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="file-info">
                  <div className="file-name">{uploadFile.name}</div>
                  <div className="file-size">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            )}
          </div>
          
          {uploading && (
            <div className="upload-progress-section">
              <h3>⏳ Uploading...</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <div className="progress-text">{uploadProgress}%</div>
              </div>
            </div>
          )}
          
          <div className="upload-actions">
            <button 
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="upload-btn"
              disabled={uploading || !uploadFile || !uploadGroup}
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <span className="btn-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  🚀 Upload Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
