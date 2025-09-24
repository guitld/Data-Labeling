import React, { useState } from 'react';
import { Group, User, Image } from '../../types';
import { groupsAPI, usersAPI, adminAPI } from '../../services/api';
import GroupCard from '../GroupCard';

interface GroupsProps {
  groups: Group[];
  images: Image[];
  user: User;
  onGroupClick: (group: Group) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const Groups: React.FC<GroupsProps> = ({
  groups,
  images,
  user,
  onGroupClick,
  onError,
  onSuccess
}) => {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [selectedGroupForUser, setSelectedGroupForUser] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  
  // Loading states
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [exportingAnnotations, setExportingAnnotations] = useState(false);
  const handleExportAnnotations = async () => {
    setExportingAnnotations(true);
    try {
      const blob = await adminAPI.exportAnnotations();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `annotations-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export annotations:', error);
      const message = error instanceof Error ? error.message : 'Failed to export annotations';
      onError(message);
    } finally {
      setExportingAnnotations(false);
    }
  };

  // Group management functions
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;

    setCreatingGroup(true);
    try {
      const response = await groupsAPI.create({
        name: newGroupName.trim(),
        description: newGroupDescription.trim()
      });

      if (response.success) {
        setNewGroupName('');
        setNewGroupDescription('');
        setShowCreateGroupModal(false);
        onSuccess();
      } else {
        onError(response.error || 'Failed to create group');
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
        const data = (error.response as { data?: { error?: string } }).data;
        onError(data?.error || 'Failed to create group');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to create group');
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddUserToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForUser || !newUserName.trim()) {
      onError('Please select a group and user');
      return;
    }

    setAddingUser(true);
    try {
      const response = await groupsAPI.addUser({
        group_id: selectedGroupForUser,
        username: newUserName.trim()
      });

      if (response.success) {
        setNewUserName('');
        setSelectedGroupForUser(null);
        setShowAddUserModal(false);
        onSuccess();
      } else {
        onError(response.error || 'Failed to add user to group');
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
        const data = (error.response as { data?: { error?: string } }).data;
        onError(data?.error || 'Failed to add user to group');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to add user to group');
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserFromGroup = async (groupId: string, username: string) => {
    try {
      const response = await groupsAPI.removeUser({
        group_id: groupId,
        username: username
      });
        
      if (response.success) {
        onSuccess();
      } else {
        onError(response.error || 'Failed to remove user from group');
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
        const data = (error.response as { data?: { error?: string } }).data;
        onError(data?.error || 'Failed to remove user from group');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to remove user from group');
      }
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description);
    setShowEditGroupModal(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editGroupName.trim() || !editGroupDescription.trim()) return;

    setUpdatingGroup(true);
    try {
      const response = await groupsAPI.update({
        group_id: editingGroup.id,
        name: editGroupName.trim(),
        description: editGroupDescription.trim()
      });

      if (response.success) {
        handleCloseEditGroupModal();
        onSuccess();
      } else {
        onError(response.error || 'Failed to update group');
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
        const data = (error.response as { data?: { error?: string } }).data;
        onError(data?.error || 'Failed to update group');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to update group');
      }
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
      const response = await groupsAPI.delete({
        group_id: groupId
      });

      if (response.success) {
        onSuccess();
      } else {
        onError(response.error || 'Failed to delete group');
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
        const data = (error.response as { data?: { error?: string } }).data;
        onError(data?.error || 'Failed to delete group');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to delete group');
      }
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleCloseEditGroupModal = () => {
    setShowEditGroupModal(false);
    setEditingGroup(null);
    setEditGroupName('');
    setEditGroupDescription('');
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setAvailableUsers(response);
    } catch (error) {
      console.error('Failed to load users:', error);
      onError('Failed to load users list');
    }
  };

  const handleAddUserClick = async (groupId: string) => {
    setSelectedGroupForUser(groupId);
    setShowAddUserModal(true);
    await loadAvailableUsers();
  };

  return (
    <div className="groups-view">
      <div className="groups-header">
        <h2>Manage Groups</h2>
        {user?.role === 'admin' && (
          <div className="groups-actions">
            <button 
              className="outline-button"
              onClick={handleExportAnnotations}
              disabled={exportingAnnotations}
            >
              {exportingAnnotations ? 'Exporting...' : 'Export Annotations'}
            </button>
            <button 
              className="login-button"
              onClick={() => setShowCreateGroupModal(true)}
            >
              + Create New Group
            </button>
          </div>
        )}
      </div>

      <div className="groups-grid">
        {groups.map((group) => {
          const groupImages = images.filter(img => img.group_id === group.id);
          return (
            <GroupCard
              key={group.id}
              group={group}
              groupImages={groupImages}
              user={user}
              onGroupClick={onGroupClick}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddUser={handleAddUserClick}
              onRemoveUser={handleRemoveUserFromGroup}
              deletingGroup={deletingGroup}
            />
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
};

export default Groups;
