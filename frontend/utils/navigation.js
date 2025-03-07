/**
 * Unified SPA navigation utility for the entire application
 * Uses hash-based navigation and custom events to maintain SPA behavior
 */

/**
 * Navigate to a different view in the application without page reload
 * @param {string} view - The view to navigate to ('landing', 'find', 'staff', etc.)
 * @param {string} [path='/'] - The base path to navigate to
 * @param {Object} [params={}] - Additional parameters to include in the navigation event
 */
export const navigateTo = (view, path = '/', params = {}) => {
  // If view is landing, remove hash, otherwise set it
  if (view === 'landing') {
    window.history.pushState(null, '', path);
  } else {
    window.history.pushState(null, '', `${path}#${view}`);
  }

  // Create navigation events
  // 1. Hash change event for components listening to hash changes
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  
  // 2. Custom view change event with additional data
  const viewChangeEvent = new CustomEvent('viewchange', {
    detail: { view, path, ...params }
  });
  window.dispatchEvent(viewChangeEvent);

  // 3. Navigation event for path-based navigation
  const navigationEvent = new CustomEvent('navigation', {
    detail: { view, path, ...params }
  });
  window.dispatchEvent(navigationEvent);
};

/**
 * Navigate to an agent's page
 * @param {string} graphName - The graph_name of the agent
 */
export const navigateToAgent = (graphName) => {
  // For agent pages, we need to actually change the URL
  const path = `/agents/${graphName}`;
  window.history.pushState(null, '', path);
  
  // Dispatch both navigation events
  const viewChangeEvent = new CustomEvent('viewchange', {
    detail: { view: 'agents', path, graphName }
  });
  window.dispatchEvent(viewChangeEvent);
  
  // This forces the application to render the new URL without a reload
  const navigationEvent = new CustomEvent('navigation', {
    detail: { view: 'agents', path, graphName, forcePathChange: true }
  });
  window.dispatchEvent(navigationEvent);
};

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