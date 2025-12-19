// 🟡 OAuth integration - OAuth success handler page
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalToast } from '../contexts/ToastContext';
import oauthProviders from '../config/oauthProviders';
import { authAPI } from '../utils/api';
import { storeAccessToken, clearStoredToken } from '../utils/tokenStorage';
import { logger } from '../utils/logger';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const { addToast } = useGlobalToast();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessedRef.current) return;
    
    const handleOAuthSuccess = async () => {
      hasProcessedRef.current = true;
      
      try {
        // Extract authorization code from URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const provider = params.get('provider');
        const error = params.get('error');
        const providerLabel = provider ? (oauthProviders.find(p => p.name === provider)?.label || provider) : 'your account';

        if (error) {
          addToast(`Oops! We couldn't sign you in with ${providerLabel}. Give it another try?`, 'error');
          navigate('/login');
          return;
        }

        if (!code) {
          addToast('Hmm, something went wrong with the sign-in process. Please try again.', 'error');
          navigate('/login');
          return;
        }

        // Exchange authorization code for tokens
        const response = await authAPI.exchangeOAuthCode(code);

        const { user, accessToken } = response.data.data;

        // Clear any old tokens and store new token using centralized utility
        clearStoredToken();
        // Decode token to get expiry (if available)
        const expiresAt = accessToken ? (() => {
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            return payload?.exp ? payload.exp * 1000 : null;
          } catch {
            return null;
          }
        })() : null;
        storeAccessToken(accessToken, expiresAt, true); // Remember user by default for OAuth

        await checkAuth();

        const userName = user.firstName || user.name || 'there';
        addToast(`Hey ${userName}! Welcome back - you're all set! 🎉`, 'success');
        navigate('/dashboard');
      } catch (error) {
        logger.error('OAuth success handler error:', error);
        addToast('We ran into an issue signing you in. Mind trying again?', 'error');
        navigate('/login');
      }
    };

    handleOAuthSuccess();
  }, [navigate, checkAuth, addToast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Completing your sign-in...
        </p>
      </div>
    </div>
  );
};
