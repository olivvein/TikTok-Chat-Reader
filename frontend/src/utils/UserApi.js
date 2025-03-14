// API utilities for user management (friends, undesirables)
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api' 
    : '/api';

/**
 * Search for users in the database
 * @param {string} query - The search query
 * @returns {Promise<Array>} - The search results
 */
export const searchUsers = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Load all user lists (friends and undesirables)
 * @returns {Promise<Object>} - Object containing friendsList and undesirablesList
 */
export const loadUserLists = async () => {
  try {
    // Get friends and undesirables in parallel
    const [friendsResponse, undesirableResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/users/friends`),
      fetch(`${API_BASE_URL}/users/undesirables`)
    ]);
    
    if (!friendsResponse.ok) {
      throw new Error(`HTTP error loading friends: ${friendsResponse.status}`);
    }
    
    if (!undesirableResponse.ok) {
      throw new Error(`HTTP error loading undesirables: ${undesirableResponse.status}`);
    }
    
    const friends = await friendsResponse.json();
    const undesirables = await undesirableResponse.json();
    
    return {
      friendsList: friends,
      undesirablesList: undesirables
    };
  } catch (error) {
    console.error('Error loading user lists:', error);
    throw error;
  }
};

/**
 * Add a user to the friends list
 * @param {string} tiktokId - The TikTok ID of the user
 * @param {string} nickname - The nickname of the user
 * @returns {Promise<Object>} - The updated friends list
 */
export const addToFriendsList = async (tiktokId, nickname) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/friends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tiktokId, nickname }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding friend:', error);
    throw error;
  }
};

/**
 * Remove a user from the friends list
 * @param {string} tiktokId - The TikTok ID of the user
 * @returns {Promise<Object>} - The updated friends list
 */
export const removeFriend = async (tiktokId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/friends/${tiktokId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

/**
 * Add a user to the undesirables list
 * @param {string} tiktokId - The TikTok ID of the user
 * @param {string} nickname - The nickname of the user
 * @param {string} reason - The reason for adding to undesirables
 * @returns {Promise<Object>} - The updated undesirables list
 */
export const addToUndesirablesList = async (tiktokId, nickname, reason = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/undesirables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tiktokId, nickname, reason }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding undesirable:', error);
    throw error;
  }
};

/**
 * Remove a user from the undesirables list
 * @param {string} tiktokId - The TikTok ID of the user
 * @returns {Promise<Object>} - The updated undesirables list
 */
export const removeUndesirable = async (tiktokId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/undesirables/${tiktokId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing undesirable:', error);
    throw error;
  }
};

/**
 * Get user preferences including theme
 * @returns {Promise<Object>} - The user preferences
 */
export const getUserPreferences = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/preferences`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};

/**
 * Save user preferences including theme
 * @param {Object} preferences - The preferences object to save
 * @returns {Promise<Object>} - The updated preferences
 */
export const saveUserPreferences = async (preferences) => {
  try {
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
}; 