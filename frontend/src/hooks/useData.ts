import { useState, useEffect } from 'react';
import { Image, Group, TagSuggestion, ApprovedTag, TagUpvote } from '../types';
import { groupsAPI, imagesAPI, tagsAPI, usersAPI } from '../services/api';

export const useData = (user: { username: string } | null) => {
  const [images, setImages] = useState<Image[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [approvedTags, setApprovedTags] = useState<ApprovedTag[]>([]);
  const [tagUpvotes, setTagUpvotes] = useState<TagUpvote[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async (showRefreshIndicator = false) => {
    if (!user) return;
    
    console.log('loadData called with user:', user.username, 'showRefreshIndicator:', showRefreshIndicator);
    
    if (showRefreshIndicator) {
      setLoading(true);
    }
    
    try {
      // Load all data in parallel
      const [groupsResponse, imagesResponse, usersResponse, tagsResponse, approvedResponse, upvotesResponse] = await Promise.all([
        groupsAPI.getAll(),
        imagesAPI.getUserImages(user.username),
        usersAPI.getAll(),
        tagsAPI.getAll(),
        tagsAPI.getApproved(),
        tagsAPI.getUpvotes()
      ]);
      
      console.log('Data loaded successfully:', {
        groups: groupsResponse.groups?.length || 0,
        images: imagesResponse.images?.length || 0,
        users: usersResponse?.length || 0,
        suggestions: tagsResponse.suggestions?.length || 0,
        approvedTags: approvedResponse.tags?.length || 0,
        upvotes: upvotesResponse.upvotes?.length || 0
      });
      
      setGroups(groupsResponse.groups || []);
      setImages(imagesResponse.images || []);
      setAvailableUsers(usersResponse || []);
      setTagSuggestions(tagsResponse.suggestions || []);
      setApprovedTags(approvedResponse.tags || []);
      setTagUpvotes(upvotesResponse.upvotes || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      if (showRefreshIndicator) {
        setLoading(false);
      }
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    images,
    groups,
    tagSuggestions,
    approvedTags,
    tagUpvotes,
    availableUsers,
    loading,
    error,
    loadData,
    setError
  };
};

