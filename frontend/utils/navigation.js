/**
 * Unified navigation utility for the entire application
 * Uses Next.js router for navigation with URL-based routes
 */

/**
 * Navigate to a different view in the application
 * @param {string} view - The view to navigate to ('landing', 'find', 'staff', etc.)
 * @param {Object} [params={}] - Additional parameters to include in the navigation
 */
export const navigateTo = (view, params = {}) => {
  // Get the router instance dynamically since we can't use hooks outside components
  const path = getPathForView(view);
  
  // For client-side code, we can use the window.location approach
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
};

/**
 * Navigate to an agent's page
 * @param {string} graphName - The graph_name of the agent
 */
export const navigateToAgent = (graphName) => {
  if (typeof window !== 'undefined') {
    window.location.href = `/agents/${graphName}`;
  }
};

/**
 * Get the path for a specific view
 * @param {string} view - The view name
 * @returns {string} The path for the view
 */
function getPathForView(view) {
  switch (view) {
    case 'landing':
      return '/';
    case 'find':
      return '/find';
    case 'staff':
      return '/staff';
    case 'agents':
      return '/agents';
    default:
      return '/';
  }
}

/**
 * Listen for navigation events in components
 * @param {Function} callback - Function to call when navigation occurs
 * @returns {Function} Cleanup function to remove the listener
 */
export const useNavigation = (callback) => {
  window.addEventListener('navigation', callback);
  return () => {
    window.removeEventListener('navigation', callback);
  };
}; 