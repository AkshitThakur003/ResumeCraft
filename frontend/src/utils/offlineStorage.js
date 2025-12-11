/**
 * @fileoverview Offline Storage Utility
 * @module utils/offlineStorage
 * @description LocalStorage-based offline storage for resume builder
 */

import { logger } from './logger'

const STORAGE_PREFIX = 'resumecraft_';
const STORAGE_VERSION = '1.0';

/**
 * Check if browser supports localStorage
 */
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get storage key with prefix
 */
const getStorageKey = (key) => `${STORAGE_PREFIX}${key}`;

/**
 * Save resume data to localStorage
 */
export const saveResumeOffline = (resumeId, resumeData) => {
  if (!isStorageAvailable()) return false;

  try {
    const key = getStorageKey(`resume_${resumeId}`);
    const data = {
      version: STORAGE_VERSION,
      resumeId,
      data: resumeData,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Error saving resume offline:', error);
    return false;
  }
};

/**
 * Load resume data from localStorage
 */
export const loadResumeOffline = (resumeId) => {
  if (!isStorageAvailable()) return null;

  try {
    const key = getStorageKey(`resume_${resumeId}`);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) {
      // Version mismatch, clear old data
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    logger.error('Error loading resume offline:', error);
    return null;
  }
};

/**
 * Remove resume from offline storage
 */
export const removeResumeOffline = (resumeId) => {
  if (!isStorageAvailable()) return false;

  try {
    const key = getStorageKey(`resume_${resumeId}`);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error('Error removing resume offline:', error);
    return false;
  }
};

/**
 * Get all offline resume IDs
 */
export const getOfflineResumeIds = () => {
  if (!isStorageAvailable()) return [];

  try {
    const keys = Object.keys(localStorage);
    const resumeKeys = keys.filter(key => 
      key.startsWith(getStorageKey('resume_'))
    );
    return resumeKeys.map(key => {
      const match = key.match(/resume_(.+)$/);
      return match ? match[1] : null;
    }).filter(Boolean);
  } catch (error) {
    logger.error('Error getting offline resume IDs:', error);
    return [];
  }
};

/**
 * Clear all offline data
 */
export const clearOfflineStorage = () => {
  if (!isStorageAvailable()) return false;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    logger.error('Error clearing offline storage:', error);
    return false;
  }
};

/**
 * Check if we're online
 */
export const isOnline = () => {
  return navigator.onLine !== false;
};

/**
 * Sync offline changes when online
 */
export const syncOfflineChanges = async (syncFunction) => {
  if (!isOnline()) {
    logger.log('Offline - changes will sync when online');
    return false;
  }

  try {
    const resumeIds = getOfflineResumeIds();
    for (const resumeId of resumeIds) {
      const offlineData = loadResumeOffline(resumeId);
      if (offlineData) {
        await syncFunction(resumeId, offlineData);
      }
    }
    return true;
  } catch (error) {
    logger.error('Error syncing offline changes:', error);
    return false;
  }
};

