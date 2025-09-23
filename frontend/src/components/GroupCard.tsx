import React from 'react';
import { Group, Image, User } from '../types';

interface GroupCardProps {
  group: Group;
  groupImages: Image[];
  user: User | null;
  onGroupClick: (group: Group) => void;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveUser: (groupId: string, username: string) => void;
  onAddUser: (groupId: string) => void;
  deletingGroup: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  groupImages,
  user,
  onGroupClick,
  onEditGroup,
  onDeleteGroup,
  onRemoveUser,
  onAddUser,
  deletingGroup
}) => {
  return (
    <div className="group-card-clickable" onClick={() => onGroupClick(group)}>
      <div className="group-card-header">
        <div className="group-title-section">
          <h3>{group.name}</h3>
          {user?.role === 'admin' && (
            <div className="group-actions">
              <button
                className="edit-group-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(group);
                }}
                title="Edit group"
              >
                ✏️
              </button>
              <button
                className="delete-group-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGroup(group.id);
                }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUser(group.id, member);
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                onAddUser(group.id);
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
};

export default GroupCard;

