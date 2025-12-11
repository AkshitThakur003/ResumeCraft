/**
 * @fileoverview Auth Forms Module
 * @module components/auth/AuthForms
 * @description 
 * Central export module for authentication form components.
 * Provides a convenient way to import LoginForm and RegisterForm components
 * from a single location.
 * 
 * @author ResumeCraft Team
 * @version 1.0.0
 */

/**
 * Login form component for user authentication
 * @typedef {import('./LoginForm').LoginForm} LoginForm
 */

/**
 * Registration form component for new user signup
 * @typedef {import('./RegisterForm').RegisterForm} RegisterForm
 */

/**
 * Exports the LoginForm component
 * @see LoginForm
 */
export { LoginForm } from './LoginForm'

/**
 * Exports the RegisterForm component
 * @see RegisterForm
 */
export { RegisterForm } from './RegisterForm'
