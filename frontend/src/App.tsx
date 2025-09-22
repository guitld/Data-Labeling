import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

interface User {
  username: string;
  role: string;
}

interface Image {
  id: string;
  filename: string;
  original_name: string;
  group_id: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  created_at: string;
  created_by: string;
}

interface TagSuggestion {
  id: string;
  image_id: string;
  tag: string;
  suggested_by: string;
  suggested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface ApprovedTag {
  id: string;
  image_id: string;
  tag: string;
  approved_by: string;
  approved_at: string;
  upvotes: number;
}

interface TagUpvote {
  id: string;
  tag_id: string;
  user_id: string;
  upvoted_at: string;
}

type View = 'dashboard' | 'gallery' | 'upload' | 'groups' | 'tags' | 'group-detail' | 'tag-review';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [images, setImages] = useState<Image[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadGroup, setUploadGroup] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [approvedTags, setApprovedTags] = useState<ApprovedTag[]>([]);
  const [tagUpvotes, setTagUpvotes] = useState<TagUpvote[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Debug modal state
  useEffect(() => {
    console.log('Modal state changed:', { showImageModal, selectedImage: selectedImage?.id });
  }, [showImageModal, selectedImage]);
  
  // Force re-render when modal state changes
  const [modalKey, setModalKey] = useState(0);
  useEffect(() => {
    if (showImageModal && selectedImage) {
      setModalKey(prev => prev + 1);
    }
  }, [showImageModal, selectedImage]);
  const [newTagText, setNewTagText] = useState('');
  const [suggestingTag, setSuggestingTag] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedGroupForUser, setSelectedGroupForUser] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<Group | null>(null);
  const [groupImages, setGroupImages] = useState<Image[]>([]);
  const [groupTags, setGroupTags] = useState<ApprovedTag[]>([]);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [uploadGroupFile, setUploadGroupFile] = useState<File | null>(null);
  const [uploadingToGroup, setUploadingToGroup] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewingTag, setReviewingTag] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentGroupPage, setCurrentGroupPage] = useState(0);
  const groupsPerPage = 6;
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Reset review index when it goes beyond available suggestions
  useEffect(() => {
    if (currentView === 'tag-review') {
      const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
      if (currentReviewIndex >= pendingSuggestions.length && pendingSuggestions.length > 0) {
        setCurrentReviewIndex(0);
      }
    }
  }, [currentView, currentReviewIndex, tagSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-search-container')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const loadData = async () => {
    try {
      // Load groups from backend
      const groupsResponse = await axios.get('http://localhost:8082/groups');
      setGroups(groupsResponse.data.groups || []);
      
      // Load images for current user
      if (user) {
        const imagesResponse = await axios.get(`http://localhost:8082/images/${user.username}`);
        setImages(imagesResponse.data.images || []);
      }
      
      // Load available users
      const usersResponse = await axios.get('http://localhost:8082/users');
      setAvailableUsers(usersResponse.data || []);
      
      // Load tags and suggestions from data.json (for now)
      const response = await fetch('/data.json');
      const data = await response.json();
      setTagSuggestions(Object.values(data.tag_suggestions));
      setApprovedTags(Object.values(data.approved_tags));
      setTagUpvotes(Object.values(data.tag_upvotes));
      
      // Generate recent activity for admin dashboard
      generateRecentActivity();
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    }
  };

  // Search function
  const searchImages = (images: Image[], query: string) => {
    if (!query.trim()) return images;
    
    const lowercaseQuery = query.toLowerCase();
    return images.filter(image => {
      // Search by image name
      if (image.original_name.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search by group name
      const group = groups.find(g => g.id === image.group_id);
      if (group && group.name.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search by uploaded by
      if (image.uploaded_by.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search by tags
      const imageTags = approvedTags.filter(tag => tag.image_id === image.id);
      if (imageTags.some(tag => tag.tag.toLowerCase().includes(lowercaseQuery))) return true;
      
      return false;
    });
  };

  const generateRecentActivity = () => {
    const activities: Array<{
      type: string;
      user: string;
      description: string;
      timestamp: Date;
      icon: string;
    }> = [];
    
    // Add recent image uploads
    images.slice(-5).forEach(image => {
      activities.push({
        type: 'upload',
        user: image.uploaded_by,
        description: `Uploaded "${image.original_name}"`,
        timestamp: new Date(image.uploaded_at),
        icon: '📤'
      });
    });
    
    // Add recent tag suggestions
    tagSuggestions.slice(-3).forEach(suggestion => {
      activities.push({
        type: 'tag_suggestion',
        user: suggestion.suggested_by,
        description: `Suggested tag "${suggestion.tag}"`,
        timestamp: new Date(suggestion.suggested_at),
        icon: '🏷️'
      });
    });
    
    // Add recent group activities
    groups.slice(-2).forEach(group => {
      activities.push({
        type: 'group_activity',
        user: group.created_by,
        description: `Created group "${group.name}"`,
        timestamp: new Date(group.created_at),
        icon: '📁'
      });
    });
    
    // Sort by timestamp and take the most recent 10
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setRecentActivity(activities.slice(0, 10));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadGroup || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('group_id', uploadGroup);
    formData.append('uploaded_by', user.username);

    try {
      const response = await axios.post('http://localhost:8082/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setError('');
        setUploadFile(null);
        setUploadGroup('');
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh images
        loadData();
      } else {
        setError(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestTag = async (imageId: string) => {
    if (!newTagText.trim() || !user) return;

    setSuggestingTag(true);
    try {
      // Simulate API call
      const newSuggestion: TagSuggestion = {
        id: `sug-${Date.now()}`,
        image_id: imageId,
        tag: newTagText.trim(),
        suggested_by: user.username,
        suggested_at: new Date().toISOString(),
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null
      };

      setTagSuggestions(prev => [...prev, newSuggestion]);
      setNewTagText('');
    } catch (error: any) {
      setError('Failed to suggest tag');
    } finally {
      setSuggestingTag(false);
    }
  };

  const handleUpvoteTag = async (tagId: string) => {
    if (!user) return;

    // Check if user already upvoted this tag
    const existingUpvote = tagUpvotes.find(upvote => 
      upvote.tag_id === tagId && upvote.user_id === user.username
    );

    if (existingUpvote) {
      // Remove upvote
      setTagUpvotes(prev => prev.filter(upvote => upvote.id !== existingUpvote.id));
      setApprovedTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, upvotes: Math.max(0, tag.upvotes - 1) } : tag
      ));
    } else {
      // Add upvote
      const newUpvote: TagUpvote = {
        id: `upvote-${Date.now()}`,
        tag_id: tagId,
        user_id: user.username,
        upvoted_at: new Date().toISOString()
      };

      setTagUpvotes(prev => [...prev, newUpvote]);
      setApprovedTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, upvotes: tag.upvotes + 1 } : tag
      ));
    }
  };

  const handleApproveTag = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;

    const suggestion = tagSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Update suggestion status
    setTagSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'approved', reviewed_by: user.username, reviewed_at: new Date().toISOString() }
        : s
    ));

    // Add to approved tags
    const newApprovedTag: ApprovedTag = {
      id: `tag-${Date.now()}`,
      image_id: suggestion.image_id,
      tag: suggestion.tag,
      approved_by: user.username,
      approved_at: new Date().toISOString(),
      upvotes: 0
    };

    setApprovedTags(prev => [...prev, newApprovedTag]);
  };

  const handleRejectTag = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;

    setTagSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'rejected', reviewed_by: user.username, reviewed_at: new Date().toISOString() }
        : s
    ));
  };

  // Group management functions
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;

    setCreatingGroup(true);
    try {
      const response = await axios.post('http://localhost:8082/groups', {
        name: newGroupName.trim(),
        description: newGroupDescription.trim()
      });

      if (response.data.success) {
        setError('');
        setNewGroupName('');
        setNewGroupDescription('');
        setShowCreateGroupModal(false);
        // Refresh groups
        loadData();
      } else {
        setError(response.data.error || 'Failed to create group');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddUserToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForUser || !newUserName.trim()) {
      setError('Please select a group and user');
      return;
    }

    console.log('Adding user to group:', { groupId: selectedGroupForUser, username: newUserName.trim() });

    setAddingUser(true);
    try {
      const response = await axios.post('http://localhost:8082/groups/add-user', {
        group_id: selectedGroupForUser,
        username: newUserName.trim()
      });

      console.log('Add user response:', response.data);

      if (response.data.success) {
        setError('');
        setNewUserName('');
        setSelectedGroupForUser(null);
        setShowAddUserModal(false);
        // Refresh groups
        await loadData();
        // Also refresh group detail if we're on that page
        if (selectedGroupDetail && selectedGroupDetail.id === selectedGroupForUser) {
          // Update the selected group detail with the new members list
          const updatedGroups = groups.filter(g => g.id === selectedGroupForUser);
          if (updatedGroups.length > 0) {
            setSelectedGroupDetail(updatedGroups[0]);
          }
        }
      } else {
        setError(response.data.error || 'Failed to add user to group');
      }
    } catch (error: any) {
      console.error('Error adding user to group:', error);
      setError(error.response?.data?.error || 'Failed to add user to group');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserFromGroup = async (groupId: string, username: string) => {
    console.log('Removing user from group:', { groupId, username });
    
    try {
      const response = await axios.post('http://localhost:8082/groups/remove-user', {
        group_id: groupId,
        username: username
          });
      
      console.log('Remove user response:', response.data);
          
          if (response.data.success) {
        setError('');
        // Refresh groups
        await loadData();
        // Also refresh group detail if we're on that page
        if (selectedGroupDetail && selectedGroupDetail.id === groupId) {
          // Update the selected group detail with the new members list
          const updatedGroups = groups.filter(g => g.id === groupId);
          if (updatedGroups.length > 0) {
            setSelectedGroupDetail(updatedGroups[0]);
          }
          const updatedGroupImages = images.filter(img => img.group_id === groupId);
          setGroupImages(updatedGroupImages);
        }
      } else {
        setError(response.data.error || 'Failed to remove user from group');
          }
        } catch (error: any) {
      console.error('Error removing user from group:', error);
      setError(error.response?.data?.error || 'Failed to remove user from group');
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description);
    setShowEditGroupModal(true);
  };

  const handleCloseEditGroupModal = () => {
    setShowEditGroupModal(false);
    setEditingGroup(null);
    setEditGroupName('');
    setEditGroupDescription('');
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editGroupName.trim() || !editGroupDescription.trim()) return;

    setUpdatingGroup(true);
    try {
      const response = await axios.post('http://localhost:8082/groups/update', {
        group_id: editingGroup.id,
        name: editGroupName.trim(),
        description: editGroupDescription.trim()
      });

      if (response.data.success) {
        setError('');
        handleCloseEditGroupModal();
        // Refresh groups
        loadData();
      } else {
        setError(response.data.error || 'Failed to update group');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update group');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group? This will also delete all images in this group.')) {
      return;
    }

    setDeletingGroup(true);
    try {
      const response = await axios.post('http://localhost:8082/groups/delete', {
        group_id: groupId
      });

      if (response.data.success) {
        setError('');
        // Refresh groups and images
        loadData();
      } else {
        setError(response.data.error || 'Failed to delete group');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete group');
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleGroupClick = async (group: Group) => {
    // Close any open modals first
    handleCloseEditGroupModal();
    setShowCreateGroupModal(false);
    setShowAddUserModal(false);
    setShowAddImageModal(false);
    
    setSelectedGroupDetail(group);
    setCurrentView('group-detail');
    
    // Load group-specific data
    try {
      // Load images for this group
      const groupImages = images.filter(img => img.group_id === group.id);
      setGroupImages(groupImages);
      
      // Load tags for this group
      const groupTags = approvedTags.filter(tag => tag.image_id && groupImages.some(img => img.id === tag.image_id));
      setGroupTags(groupTags);
    } catch (error: any) {
      setError('Failed to load group data');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:8082/images/delete/${imageId}`);
      
      if (response.data.success) {
        setError('');
        // Refresh group data
        const updatedGroupImages = groupImages.filter(img => img.id !== imageId);
        setGroupImages(updatedGroupImages);
        // Also refresh main images list
        loadData();
      } else {
        setError(response.data.error || 'Failed to delete image');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete image');
    }
  };

  const handleUploadToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadGroupFile || !selectedGroupDetail || !user) {
      setError('Please select a file and make sure you are logged in');
      return;
    }

    setUploadingToGroup(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadGroupFile);
      formData.append('group_id', selectedGroupDetail.id);
      formData.append('uploaded_by', user.username);

      console.log('Uploading to group:', selectedGroupDetail.id);
      console.log('Uploaded by:', user.username);
      console.log('File:', uploadGroupFile.name);

      const response = await axios.post('http://localhost:8082/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setError('');
        setUploadGroupFile(null);
        setShowAddImageModal(false);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh all data
        await loadData();
        // Refresh group images specifically
        const updatedGroupImages = images.filter(img => img.group_id === selectedGroupDetail.id);
        setGroupImages(updatedGroupImages);
      } else {
        setError(response.data.error || 'Failed to upload image');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingToGroup(false);
    }
  };

  const handleReviewApprove = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;
    
    setReviewingTag(true);
    try {
      await handleApproveTag(suggestionId);
      // Move to next suggestion, but don't go beyond the array
      setCurrentReviewIndex(prev => {
        const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
        return Math.min(prev + 1, pendingSuggestions.length - 1);
      });
    } catch (error) {
      console.error('Failed to approve tag:', error);
      setError('Failed to approve tag');
    } finally {
      setReviewingTag(false);
    }
  };

  const handleReviewReject = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;
    
    setReviewingTag(true);
    try {
      await handleRejectTag(suggestionId);
      // Move to next suggestion, but don't go beyond the array
      setCurrentReviewIndex(prev => {
        const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
        return Math.min(prev + 1, pendingSuggestions.length - 1);
      });
    } catch (error) {
      console.error('Failed to reject tag:', error);
      setError('Failed to reject tag');
    } finally {
      setReviewingTag(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8082/login', {
        username,
        password
      });

      if (response.data.success) {
        setUser({
          username: response.data.username,
          role: response.data.role
        });
      } else {
        setError('Login failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
      setUsername('');
    setPassword('');
    setError('');
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        const totalImages = images.length;
        const totalGroups = groups.length;
        const totalUsers = availableUsers.length;
        const pendingSuggestionsCount = tagSuggestions.filter(sug => sug.status === 'pending').length;
        const approvedTagsCount = approvedTags.length;
        const totalUpvotes = tagUpvotes.length;
        
        // Calculate activity metrics
        const today = new Date();
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentImages = images.filter(img => new Date(img.uploaded_at) >= last7Days).length;
        const recentGroups = groups.filter(group => new Date(group.created_at) >= last7Days).length;
        const recentSuggestions = tagSuggestions.filter(sug => new Date(sug.suggested_at) >= last7Days).length;
        
        // Calculate group distribution
        const groupDistribution = groups.map(group => ({
          name: group.name,
          count: images.filter(img => img.group_id === group.id).length
        })).sort((a, b) => b.count - a.count);
        
        // Calculate user activity
        const userActivity = availableUsers.map(username => {
          const userImages = images.filter(img => img.uploaded_by === username).length;
          const userSuggestions = tagSuggestions.filter(sug => sug.suggested_by === username).length;
          return {
            username,
            images: userImages,
            suggestions: userSuggestions,
            total: userImages + userSuggestions
          };
        }).sort((a, b) => b.total - a.total);

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
                      <h3>{totalImages}</h3>
                      <p>Total Images</p>
                      <span className="metric-trend">
                        +{recentImages} this week
                      </span>
            </div>
          </div>
                  
                  <div className="metric-card success">
                    <div className="metric-icon">📁</div>
                    <div className="metric-content">
                      <h3>{totalGroups}</h3>
                      <p>Groups</p>
                      <span className="metric-trend">
                        +{recentGroups} this week
                      </span>
                </div>
              </div>
                  
                  <div className="metric-card warning">
                    <div className="metric-icon">👥</div>
                    <div className="metric-content">
                      <h3>{totalUsers}</h3>
                      <p>Active Users</p>
                      <span className="metric-trend">
                        {userActivity.length > 0 ? `${userActivity[0].username} most active` : 'No activity yet'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="metric-card info">
                    <div className="metric-icon">🏷️</div>
                    <div className="metric-content">
                      <h3>{approvedTagsCount}</h3>
                      <p>Approved Tags</p>
                      <span className="metric-trend">
                        +{recentSuggestions} suggestions this week
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
                        <div className="stat-value pending">{pendingSuggestionsCount}</div>
                      </div>
                      <div className="quick-stat">
                        <div className="stat-label">Total Upvotes</div>
                        <div className="stat-value">{totalUpvotes}</div>
                      </div>
                      <div className="quick-stat">
                        <div className="stat-label">Avg Images/Group</div>
                        <div className="stat-value">
                          {totalGroups > 0 ? Math.round(totalImages / totalGroups) : 0}
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
                  onClick={() => setCurrentView('gallery')}
                      >
                  <span className="action-icon">🖼️</span>
                  <span className="action-text">View Gallery</span>
                  <span className="action-count">{totalImages}</span>
                      </button>
                
                {user?.role === 'admin' && (
                  <>
                    <button 
                      className="action-button success"
                      onClick={() => setCurrentView('upload')}
                    >
                      <span className="action-icon">📤</span>
                      <span className="action-text">Upload Images</span>
                    </button>
                    
                    <button 
                      className="action-button info"
                      onClick={() => setCurrentView('groups')}
                    >
                      <span className="action-icon">📁</span>
                      <span className="action-text">Manage Groups</span>
                      <span className="action-count">{totalGroups}</span>
                    </button>
                    
                    <button 
                      className="action-button warning"
                      onClick={() => setCurrentView('tags')}
                    >
                      <span className="action-icon">🏷️</span>
                      <span className="action-text">Manage Tags</span>
                      {pendingSuggestionsCount > 0 && (
                        <span className="action-badge">{pendingSuggestionsCount}</span>
                      )}
                    </button>
                    
                    {pendingSuggestionsCount > 0 && (
                      <button 
                        className="action-button urgent"
                        onClick={() => {
                          setCurrentReviewIndex(0);
                          setCurrentView('tag-review');
                        }}
                      >
                        <span className="action-icon">👆</span>
                        <span className="action-text">Review Tags</span>
                        <span className="action-badge urgent">{pendingSuggestionsCount}</span>
                      </button>
                    )}
                  </>
                        )}
                      </div>
                    </div>
                </div>
        );
      
      case 'gallery':
        let filteredImages = selectedGroup 
          ? images.filter(img => img.group_id === selectedGroup)
          : images;
        
        // Apply search
        filteredImages = searchImages(filteredImages, searchQuery);

        return (
          <div className="gallery">
            <div className="gallery-header">
              {/* Search Info */}
              {searchQuery && (
                <div className="gallery-info">
                  <div className="search-info">
                    <span className="search-badge">
                      🔍 "{searchQuery}" ({filteredImages.length} results)
                    </span>
                  </div>
                </div>
              )}
              
              <div className="group-selector">
                      <button 
                  className={`group-folder ${selectedGroup === null ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(null)}
                      >
                  📁 All Groups ({images.length})
                      </button>
                {groups.map((group) => {
                  const groupImages = images.filter(img => img.group_id === group.id);
                  return (
                      <button 
                      key={group.id}
                      className={`group-folder ${selectedGroup === group.id ? 'active' : ''}`}
                      onClick={() => setSelectedGroup(group.id)}
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
                <p>This group doesn't have any images yet.</p>
              </div>
            ) : (
              <div className="image-grid">
                {filteredImages.map((image) => {
                  const imageTags = approvedTags.filter(tag => tag.image_id === image.id);
                  const imageSuggestions = tagSuggestions.filter(sug => sug.image_id === image.id);
                  
                  return (
                    <div key={image.id} className="image-item">
                      <div className="image-container" onClick={() => {
                        setSelectedImage(image);
                        setShowImageModal(true);
                      }}>
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
                                handleDeleteImage(image.id);
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
                          {groups.find(g => g.id === image.group_id)?.name || 'Unknown Group'}
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
                })}
              </div>
            )}

                        </div>
        );
      
      case 'upload':
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
                          const groupImages = images.filter(img => img.group_id === group.id);
                          return (
                            <div
                              key={group.id}
                              className={`group-option ${uploadGroup === group.id ? 'selected' : ''}`}
                              onClick={() => setUploadGroup(group.id)}
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
                          onClick={() => setCurrentView('groups')}
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
                      <span>Supports: JPG, PNG, GIF, WebP</span>
                </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
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
                    onClick={() => {
                      setUploadFile(null);
                      setUploadGroup('');
                      setUploadProgress(0);
                    }}
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
      
      case 'groups':
        return (
          <div className="groups-view">
            <div className="groups-header">
              <h2>Manage Groups</h2>
              {user?.role === 'admin' && (
                <button 
                  className="login-button"
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  + Create New Group
                </button>
              )}
            </div>

          <div className="groups-grid">
            {groups.map((group) => {
                const groupImages = images.filter(img => img.group_id === group.id);
              return (
                  <div key={group.id} className="group-card-clickable" onClick={() => handleGroupClick(group)}>
                  <div className="group-card-header">
                    <div className="group-title-section">
                    <h3>{group.name}</h3>
                      {user?.role === 'admin' && (
                        <div className="group-actions">
                          <button
                            className="edit-group-btn"
                            onClick={() => handleEditGroup(group)}
                            title="Edit group"
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-group-btn"
                            onClick={() => handleDeleteGroup(group.id)}
                            title="Delete group"
                            disabled={deletingGroup}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="group-stats">
                      <span className="stat-item">
                        👥 {group.members.length} members
                      </span>
                      <span className="stat-item">
                        🖼️ {groupImages.length} images
                      </span>
                    </div>
                  </div>
                  <p className="group-description">{group.description}</p>
                  <div className="group-members-preview">
                      <strong>Members:</strong>
                      <div className="members-list">
                        {group.members.map((member, index) => (
                          <div key={index} className="member-tag">
                            {member}
                            {user?.role === 'admin' && member !== 'admin' && (
                              <button
                                className="remove-member-btn"
                                onClick={() => handleRemoveUserFromGroup(group.id, member)}
                                title="Remove user"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {user?.role === 'admin' && (
                          <button
                            className="add-member-plus-button"
                            onClick={async () => {
                              setSelectedGroupForUser(group.id);
                              setShowAddUserModal(true);
                              // Load available users
                              try {
                                const response = await axios.get('http://localhost:8082/users');
                                setAvailableUsers(response.data);
                              } catch (error) {
                                console.error('Failed to load users:', error);
                                setError('Failed to load users list');
                              }
                            }}
                            title="Add user"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="group-meta">
                      <small>
                        Created by {group.created_by} • {new Date(group.created_at).toLocaleDateString()}
                      </small>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Create Group Modal */}
            {showCreateGroupModal && (
              <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
                <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close"
                    onClick={() => setShowCreateGroupModal(false)}
                  >
                    ×
                  </button>
                  
                  <div className="create-group-section">
                    <h3>Create New Group</h3>
                    <form onSubmit={handleCreateGroup}>
                      <div className="form-group">
                        <label className="form-label">Group Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name..."
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Enter group description..."
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="modal-save-section">
                        <button 
                          type="submit" 
                          className="save-changes-button"
                          disabled={creatingGroup || !newGroupName.trim() || !newGroupDescription.trim()}
                        >
                          {creatingGroup ? 'Creating...' : 'Create Group'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
              <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
                <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    ×
                  </button>

          <div className="add-user-section">
            <h3>Add User to Group</h3>
                    <form onSubmit={handleAddUserToGroup}>
            <div className="form-group">
                        <label className="form-label">Search and Select User</label>
                        <div className="user-search-container">
                          <input
                            type="text"
                            className="form-input user-search-input"
                            placeholder="Search users..."
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                            onFocus={() => setShowUserDropdown(true)}
                          required
                          />
                          {showUserDropdown && (
                            <div className="user-dropdown">
                              {availableUsers
                                .filter(username => 
                                  username !== user?.username && 
                                  username.toLowerCase().includes(newUserName.toLowerCase())
                                )
                                .map(username => (
                                  <div
                                    key={username}
                                    className="user-dropdown-item"
                                    onClick={() => {
                                      setNewUserName(username);
                                      setShowUserDropdown(false);
                                    }}
                                  >
                                    {username}
                                  </div>
                                ))}
                              {availableUsers.filter(username => 
                                username !== user?.username && 
                                username.toLowerCase().includes(newUserName.toLowerCase())
                              ).length === 0 && (
                                <div className="user-dropdown-item no-results">
                                  No users found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="modal-save-section">
                        <button 
                          type="submit" 
                          className="save-changes-button"
                          disabled={addingUser || !newUserName.trim()}
                        >
                          {addingUser ? 'Adding...' : 'Add User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Group Modal */}
            {showEditGroupModal && editingGroup && (
              <div className="modal-overlay" onClick={handleCloseEditGroupModal}>
                <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close"
                    onClick={handleCloseEditGroupModal}
                  >
                    ×
                  </button>
                  
                  <div className="create-group-section">
                    <h3>Edit Group</h3>
                    <form onSubmit={handleUpdateGroup}>
                      <div className="form-group">
                        <label className="form-label">Group Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          placeholder="Enter group name..."
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          value={editGroupDescription}
                          onChange={(e) => setEditGroupDescription(e.target.value)}
                          placeholder="Enter group description..."
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="modal-save-section">
                        <button 
                          type="button"
                          className="login-button"
                          onClick={handleCloseEditGroupModal}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="save-changes-button"
                          disabled={updatingGroup}
                        >
                          {updatingGroup ? 'Updating...' : 'Update Group'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
    </div>
  );

      case 'group-detail':
        if (!selectedGroupDetail) {
          return <div>Group not found</div>;
        }

        return (
          <div className="group-detail-view">
            <div className="group-detail-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('groups')}
              >
                ← Back to Groups
              </button>
              <div className="group-detail-title">
                <h2>{selectedGroupDetail.name}</h2>
                <p className="group-detail-description">{selectedGroupDetail.description}</p>
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
                  <h3>Members ({selectedGroupDetail.members.length})</h3>
                  <div className="members-list">
                    {selectedGroupDetail.members.map((member, index) => (
                      <div key={index} className="member-item">
                        <span className="member-name">{member}</span>
                        {user?.role === 'admin' && member !== 'admin' && (
                          <button
                            className="remove-member-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUserFromGroup(selectedGroupDetail.id, member);
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
                    <button
                      className="add-member-btn"
                      onClick={async () => {
                        console.log('Add member button clicked');
                        setSelectedGroupForUser(selectedGroupDetail.id);
                        setShowAddUserModal(true);
                        // Load available users
                        try {
                          console.log('Loading users from backend...');
                          const response = await axios.get('http://localhost:8082/users');
                          console.log('Users loaded:', response.data);
                          setAvailableUsers(response.data);
                        } catch (error) {
                          console.error('Failed to load users:', error);
                          setError('Failed to load users list');
                        }
                      }}
                    >
                      <span>+</span> Add Member
                    </button>
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
                      <div key={image.id} className="group-image-item">
                        <div className="image-container">
                          <img
                            src={`http://localhost:8082/uploads/${image.filename}`}
                            alt={image.original_name}
                            className="group-image"
                          />
                          <div className="image-overlay">
                            <button
                              className="view-image-btn"
                              onClick={() => {
                                setSelectedImage(image);
                                setShowImageModal(true);
                              }}
                              title="View image"
                            >
                              👁️
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                className="delete-image-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
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
                        </div>
                      </div>
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
                    <h3>Add Image to {selectedGroupDetail.name}</h3>
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

            {/* Add User Modal */}
            {showAddUserModal && (
              <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
                <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    ×
                  </button>

                  <div className="add-user-section">
                    <h3>Add User to Group</h3>
                    <form onSubmit={handleAddUserToGroup}>
                      <div className="form-group">
                        <label className="form-label">Search and Select User</label>
                        <div className="user-search-container">
                          <input
                            type="text"
                            className="form-input user-search-input"
                            placeholder="Search users..."
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            onFocus={() => setShowUserDropdown(true)}
                            required
                          />
                          {showUserDropdown && (
                            <div className="user-dropdown">
                          {availableUsers
                                .filter(username => 
                                  username !== user?.username && 
                                  username.toLowerCase().includes(newUserName.toLowerCase())
                                )
                            .map(username => (
                                  <div
                                    key={username}
                                    className="user-dropdown-item"
                                    onClick={() => {
                                      setNewUserName(username);
                                      setShowUserDropdown(false);
                                    }}
                                  >
                                {username}
                                  </div>
                                ))}
                              {availableUsers.filter(username => 
                                username !== user?.username && 
                                username.toLowerCase().includes(newUserName.toLowerCase())
                              ).length === 0 && (
                                <div className="user-dropdown-item no-results">
                                  No users found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
            </div>
            
                      <div className="modal-save-section">
            <button 
                          type="submit" 
                          className="save-changes-button"
                          disabled={addingUser || !newUserName.trim()}
                        >
                          {addingUser ? 'Adding...' : 'Add User'}
            </button>
                      </div>
                    </form>
                  </div>
          </div>
        </div>
      )}

          </div>
        );
      
      case 'tag-review':
        const pendingSuggestionsForReview = tagSuggestions.filter(sug => sug.status === 'pending');
        const currentSuggestion = pendingSuggestionsForReview[currentReviewIndex];
        const currentImage = currentSuggestion ? images.find(img => img.id === currentSuggestion.image_id) : null;

        if (pendingSuggestionsForReview.length === 0) {
          return (
            <div className="tag-review-view">
              <div className="review-empty-state">
                <h2>🎉 All Done!</h2>
                <p>No pending tag suggestions to review.</p>
                <button 
                  className="login-button"
                  onClick={() => setCurrentView('tags')}
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
                    setCurrentView('tags');
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
                  src={`http://localhost:8082/uploads/${currentImage.filename}`}
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
                  onClick={() => setCurrentReviewIndex(prev => prev + 1)}
                  disabled={reviewingTag}
                >
                  Skip
                </button>
                <button 
                  className="back-btn-modern"
                  onClick={() => setCurrentView('tags')}
                >
                  Back to Tags
                </button>
              </div>
            </div>
    </div>
  );
      
      case 'tags':
        const pendingSuggestions = tagSuggestions.filter(sug => sug.status === 'pending');
        const approvedSuggestions = tagSuggestions.filter(sug => sug.status === 'approved');
        const rejectedSuggestions = tagSuggestions.filter(sug => sug.status === 'rejected');

  return (
    <div className="tags-view">
      <h2>Manage Tags</h2>
      
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
                            console.log('Image clicked:', image);
                            if (image) {
                              console.log('Setting selected image and opening modal');
                              setSelectedImage(image);
                              setShowImageModal(true);
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
                              console.log('View button clicked:', image);
                              if (image) {
                                console.log('Opening modal from button');
                                setSelectedImage(image);
                                setShowImageModal(true);
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
                        <div className="suggestion-actions-minimal">
                  <button 
                            className="action-btn approve-minimal"
                            onClick={() => handleApproveTag(suggestion.id)}
                            title="Approve"
                  >
                    ✓
                  </button>
                  <button 
                            className="action-btn reject-minimal"
                            onClick={() => handleRejectTag(suggestion.id)}
                            title="Reject"
                  >
                    ✗
                  </button>
                </div>
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
                        <div className="vote-count-minimal" onClick={() => handleUpvoteTag(tag.id)}>
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
      
      default:
        return null;
    }
  };

  if (!user) {
  return (
    <div className="app">
        <div className="login-container">
          <h1 className="login-title">ImageHub Login</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
              {error && <div className="error-message">{error}</div>}
            </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-layout">
        <nav className="sidebar open">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🖼️</span>
              <span className="logo-text">ImageHub</span>
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
                  onClick={() => setCurrentView('dashboard')}
                >
                  <span className="nav-icon">📊</span>
                  <span className="nav-label">Dashboard</span>
                </button>
                <button 
                  className={`nav-item ${currentView === 'gallery' ? 'active' : ''}`}
                        onClick={() => setCurrentView('gallery')}
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
                        onClick={() => setCurrentView('upload')}
                      >
                    <span className="nav-icon">📤</span>
                    <span className="nav-label">Upload</span>
                      </button>
                      <button 
                    className={`nav-item ${currentView === 'groups' ? 'active' : ''}`}
                        onClick={() => setCurrentView('groups')}
                      >
                    <span className="nav-icon">📁</span>
                    <span className="nav-label">Groups</span>
                      </button>
                      <button 
                    className={`nav-item ${currentView === 'tags' ? 'active' : ''}`}
                        onClick={() => setCurrentView('tags')}
                      >
                    <span className="nav-icon">🏷️</span>
                    <span className="nav-label">Tags</span>
                      </button>
                      
                      {user?.role === 'admin' && (
                        <button 
                          className={`nav-item ${currentView === 'tag-review' ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentReviewIndex(0);
                            setCurrentView('tag-review');
                          }}
                        >
                          <span className="nav-icon">👆</span>
                          <span className="nav-label">
                            Tag Review
                            {tagSuggestions.filter(sug => sug.status === 'pending').length > 0 && (
                              <span className="nav-badge">
                                {tagSuggestions.filter(sug => sug.status === 'pending').length}
                              </span>
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </nav>
        
        <div className="main-content sidebar-open">
          <div className="content-header">
            <div className="header-top">
              <h1 className="page-title">
                {currentView === 'dashboard' && 'Dashboard'}
                {currentView === 'gallery' && 'Image Gallery'}
                {currentView === 'upload' && 'Upload Images'}
                {currentView === 'groups' && 'Manage Groups'}
                {currentView === 'tags' && 'Manage Tags'}
                {currentView === 'tag-review' && 'Tag Review'}
              </h1>
              
              {/* Search Bar - Only in Gallery */}
              {currentView === 'gallery' && (
                <div className="global-search-container">
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="global-search-input"
                      placeholder="Search images, tags, groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="content-body">
            {renderContent()}
            </div>
          </div>
        </div>
        
        {/* Global Image Modal */}
        {showImageModal && selectedImage && (
          <div key={modalKey} className="modal-overlay" onClick={() => setShowImageModal(false)}>
            <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setShowImageModal(false)}
              >
                ×
              </button>
              
              <div className="modal-layout">
                <div className="modal-image-container">
                  <img
                    src={`http://localhost:8082/uploads/${selectedImage.filename}`}
                    alt={selectedImage.original_name}
                    className="modal-image-large"
                  />
                </div>
                
                <div className="modal-sidebar">
                  <div className="image-details">
                    <h3>{selectedImage.original_name}</h3>
                    <p><strong>Uploaded by:</strong> {selectedImage.uploaded_by}</p>
                    <p><strong>Date:</strong> {new Date(selectedImage.uploaded_at).toLocaleDateString()}</p>
                    <p><strong>Group:</strong> {groups.find(g => g.id === selectedImage.group_id)?.name || 'Unknown'}</p>
                  </div>

                  <div className="tag-suggestion-box">
                    <h4>Suggest a Tag</h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (selectedImage) {
                        handleSuggestTag(selectedImage.id);
                      }
                    }}>
                      <div className="tag-input-group">
                        <input
                          type="text"
                          className="form-input"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          placeholder="Enter tag suggestion..."
                          required
                        />
                        <button
                          type="submit"
                          className="login-button"
                          disabled={suggestingTag || !newTagText.trim()}
                        >
                          {suggestingTag ? 'Suggesting...' : 'Suggest'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="all-tags-section">
                    <h4>Approved Tags</h4>
                    {approvedTags
                      .filter(tag => tag.image_id === selectedImage.id)
                      .sort((a, b) => {
                        const aUpvoted = tagUpvotes.some(upvote =>
                          upvote.tag_id === a.id && upvote.user_id === user?.username
                        );
                        const bUpvoted = tagUpvotes.some(upvote =>
                          upvote.tag_id === b.id && upvote.user_id === user?.username
                        );

                        if (aUpvoted && !bUpvoted) return -1;
                        if (!aUpvoted && bUpvoted) return 1;
                        return b.upvotes - a.upvotes;
                      })
                      .length > 0 ? (
                      <div className="tag-list">
                        {approvedTags
                          .filter(tag => tag.image_id === selectedImage.id)
                          .sort((a, b) => {
                            const aUpvoted = tagUpvotes.some(upvote =>
                              upvote.tag_id === a.id && upvote.user_id === user?.username
                            );
                            const bUpvoted = tagUpvotes.some(upvote =>
                              upvote.tag_id === b.id && upvote.user_id === user?.username
                            );

                            if (aUpvoted && !bUpvoted) return -1;
                            if (!aUpvoted && bUpvoted) return 1;
                            return b.upvotes - a.upvotes;
                          })
                          .map(tag => {
                            const hasUpvoted = tagUpvotes.some(upvote =>
                              upvote.tag_id === tag.id && upvote.user_id === user?.username
                            );
                            return (
                              <div key={tag.id} className="tag-item-approved">
                                <div className={`upvote-section ${hasUpvoted ? 'upvoted' : 'not-upvoted'}`} onClick={() => handleUpvoteTag(tag.id)}>
                                  <span className="upvote-count">{tag.upvotes}</span>
                                </div>
                                <span className="tag-text">{tag.tag}</span>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="no-tags">No approved tags yet.</p>
                    )}
                  </div>

                  {user?.role === 'admin' && (
                    <div className="tags-section">
                      <h4>Pending Suggestions</h4>
                      {tagSuggestions.filter(sug =>
                        sug.image_id === selectedImage.id && sug.status === 'pending'
                      ).length > 0 ? (
                        <div className="tag-list">
                          {tagSuggestions
                            .filter(sug => sug.image_id === selectedImage.id && sug.status === 'pending')
                            .map(suggestion => (
                              <div key={suggestion.id} className="tag-item">
                                <span className="tag-text">{suggestion.tag}</span>
                                <div className="tag-actions">
                                  <button
                                    className="approve-button-small"
                                    onClick={() => handleApproveTag(suggestion.id)}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="reject-button-small"
                                    onClick={() => handleRejectTag(suggestion.id)}
                                  >
                                    ✗
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="no-tags">No pending suggestions.</p>
                      )}
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <div className="tags-section">
                      <h4 className="rejected-title">Rejected Suggestions</h4>
                      {tagSuggestions.filter(sug =>
                        sug.image_id === selectedImage.id && sug.status === 'rejected'
                      ).length > 0 ? (
                        <div className="tag-list">
                          {tagSuggestions
                            .filter(sug => sug.image_id === selectedImage.id && sug.status === 'rejected')
                            .map(suggestion => (
                              <div key={suggestion.id} className="tag-item-rejected">
                                <span className="tag-text">{suggestion.tag}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="no-tags">No rejected suggestions.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;