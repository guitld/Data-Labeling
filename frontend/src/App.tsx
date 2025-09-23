import React, { useState, useEffect } from 'react';
import { View, Image, Group } from './types';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { imagesAPI, tagsAPI } from './services/api';
import { Login, Sidebar, Header, ImageModal, ErrorBoundary } from './components';
import { Dashboard, Gallery, Upload, Groups, Tags, TagReview, GroupDetail } from './components/views';
import Chat from './components/views/Chat';

const App: React.FC = () => {
  const { user, login, logout, error: authError, setError: setAuthError } = useAuth();
  
  // Debug log
  console.log('App rendered with user:', user);
  const { 
    images, 
    groups, 
    tagSuggestions, 
    approvedTags, 
    tagUpvotes, 
    availableUsers, 
    loading: dataLoading, 
    error: dataError, 
    loadData, 
    setError: setDataError 
  } = useData(user);

  // UI State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [suggestingTag, setSuggestingTag] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<Group | null>(null);

  // Update selectedGroupDetail when groups are updated
  useEffect(() => {
    if (selectedGroupDetail && groups.length > 0) {
      const updatedGroup = groups.find(g => g.id === selectedGroupDetail.id);
      if (updatedGroup) {
        setSelectedGroupDetail(updatedGroup);
      }
    }
  }, [groups, selectedGroupDetail]);
  
  // Force re-render when modal state changes
  const [modalKey, setModalKey] = useState(0);
  useEffect(() => {
    if (showImageModal && selectedImage) {
      setModalKey(prev => prev + 1);
    }
  }, [showImageModal, selectedImage]);

  // Error handling
  const error = authError || dataError;
  const setError = (error: string) => {
    setAuthError(error);
    setDataError(error);
  };

  // Image handlers
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      const response = await imagesAPI.delete(imageId);
      
      if (response.success) {
        setError('');
        await loadData();
      } else {
        setError(response.error || 'Failed to delete image');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error || 'Failed to delete image'
        : 'Failed to delete image';
      setError(errorMessage);
    }
  };

  // Tag handlers
  const handleSuggestTag = async (imageId: string, tag: string) => {
    if (!user) return;

    setSuggestingTag(true);
    try {
      const response = await tagsAPI.suggest({
        image_id: imageId,
        tag: tag,
        suggested_by: user.username
      });

      if (response.success) {
        await loadData();
        setError('');
      } else {
        setError('Failed to suggest tag');
      }
    } catch (error: unknown) {
      console.error('Error suggesting tag:', error);
      setError('Failed to suggest tag');
    } finally {
      setSuggestingTag(false);
    }
  };

  const handleUpvoteTag = async (tagId: string) => {
    if (!user) return;

    try {
      const response = await tagsAPI.upvote({
        tag_id: tagId,
        user_id: user.username
      });

      if (response.success) {
        await loadData();
        setError('');
      } else {
        setError('Failed to upvote tag');
      }
    } catch (error: unknown) {
      console.error('Error upvoting tag:', error);
      setError('Failed to upvote tag');
    }
  };

  const handleApproveTag = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;

    try {
      const response = await tagsAPI.review({
        suggestion_id: suggestionId,
        status: 'approved',
        reviewed_by: user.username
      });

      if (response.success) {
        await loadData();
        setError('');
      } else {
        setError('Failed to approve tag');
      }
    } catch (error: unknown) {
      console.error('Error approving tag:', error);
      setError('Failed to approve tag');
    }
  };

  const handleRejectTag = async (suggestionId: string) => {
    if (!user || user.role !== 'admin') return;

    try {
      const response = await tagsAPI.review({
        suggestion_id: suggestionId,
        status: 'rejected',
        reviewed_by: user.username
      });

      if (response.success) {
        await loadData();
        setError('');
      } else {
        setError('Failed to reject tag');
      }
    } catch (error: unknown) {
      console.error('Error rejecting tag:', error);
      setError('Failed to reject tag');
    }
  };

  // View handlers
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setSelectedGroup(null);
    setSearchQuery('');
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
    setSelectedGroup(null);
    setSearchQuery('');
    setSelectedGroupDetail(null);
  };

  const handleGroupClick = (group: Group) => {
    setSelectedGroupDetail(group);
    setCurrentView('group-detail');
  };

  const handleBackToGroups = () => {
    setSelectedGroupDetail(null);
    setCurrentView('groups');
  };

  const handleBackToTags = () => {
    setCurrentView('tags');
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
  return (
          <Dashboard
            user={user!}
            images={images}
            groups={groups}
            tagSuggestions={tagSuggestions}
            approvedTags={approvedTags}
            tagUpvotes={tagUpvotes}
            availableUsers={availableUsers}
            onViewChange={handleViewChange}
          />
        );
      
      case 'gallery':
        return (
          <Gallery
            images={images}
            groups={groups}
            approvedTags={approvedTags}
            tagSuggestions={tagSuggestions}
            user={user}
            selectedGroup={selectedGroup}
            searchQuery={searchQuery}
            onGroupSelect={handleGroupSelect}
            onImageClick={handleImageClick}
            onDeleteImage={handleDeleteImage}
          />
        );
      
      case 'upload':
        return (
          <Upload
            groups={groups}
            user={user!}
            onUploadSuccess={loadData}
            onError={setError}
          />
        );
      
      case 'groups':
        return (
          <Groups
            groups={groups}
            images={images}
            user={user!}
            onGroupClick={handleGroupClick}
            onError={setError}
            onSuccess={loadData}
          />
        );
      
      case 'tags':
        return (
          <Tags
            tagSuggestions={tagSuggestions}
            approvedTags={approvedTags}
            tagUpvotes={tagUpvotes}
            images={images}
            groups={groups}
            user={user!}
            onApproveTag={handleApproveTag}
            onRejectTag={handleRejectTag}
            onUpvoteTag={handleUpvoteTag}
            onImageClick={handleImageClick}
          />
  );

      case 'group-detail':
        if (!selectedGroupDetail) {
          return <div>Group not found</div>;
        }
        return (
          <GroupDetail
            group={selectedGroupDetail}
            images={images}
            approvedTags={approvedTags}
            user={user!}
            onBackToGroups={handleBackToGroups}
            onImageClick={handleImageClick}
            onDeleteImage={handleDeleteImage}
            onError={setError}
            onSuccess={loadData}
          />
        );
      
      case 'tag-review':
          return (
          <TagReview
            tagSuggestions={tagSuggestions}
            images={images}
            groups={groups}
            user={user!}
            onApproveTag={handleApproveTag}
            onRejectTag={handleRejectTag}
            onBackToTags={handleBackToTags}
          />
        );
      
      case 'chat':
        return (
          <Chat
            groups={groups}
            images={images}
            tagSuggestions={tagSuggestions}
            approvedTags={approvedTags}
            onError={setError}
          />
        );
      
      default:
        return null;
    }
  };

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={login} loading={false} error={authError} />;
  }

  const pendingSuggestionsCount = tagSuggestions.filter(sug => sug.status === 'pending').length;

  return (
    <ErrorBoundary>
    <div className="app">
      <div className="app-layout">
          <Sidebar
            user={user}
            currentView={currentView}
            onViewChange={handleViewChange}
            onLogout={handleLogout}
            pendingSuggestionsCount={pendingSuggestionsCount}
          />
        
        <div className="main-content sidebar-open">
            <Header
              currentView={currentView}
              isRefreshing={dataLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              error={error}
            />

          <div className="content-body">
            {renderContent()}
            </div>
          </div>
        </div>
        
        {/* Global Image Modal */}
        {showImageModal && selectedImage && (
          <ImageModal
            key={modalKey}
            image={selectedImage}
            groups={groups}
            approvedTags={approvedTags}
            tagSuggestions={tagSuggestions}
            tagUpvotes={tagUpvotes}
            user={user}
            onClose={() => setShowImageModal(false)}
            onSuggestTag={handleSuggestTag}
            onUpvoteTag={handleUpvoteTag}
            onApproveTag={handleApproveTag}
            onRejectTag={handleRejectTag}
            suggestingTag={suggestingTag}
          />
                    )}
                  </div>
    </ErrorBoundary>
  );
};

export default App;

