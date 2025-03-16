/**
 * Deep object inspection utility for debugging
 * 
 * This file contains utility functions for inspecting JavaScript objects
 * in depth, revealing their complete structure for debugging purposes.
 */

/**
 * Deeply inspects an object and returns a string representation of its structure
 * with circular references handled properly.
 * 
 * @param {any} obj - The object to inspect
 * @param {number} [depth=5] - Maximum depth to traverse
 * @param {Set} [seen=new Set()] - Set of already seen objects to prevent circular references
 * @param {number} [level=0] - Current level of nesting (used internally)
 * @returns {string} - String representation of the object structure
 */
export function deepInspect(obj, depth = 5, seen = new Set(), level = 0) {
  // Handle primitive values
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj !== "object" && typeof obj !== "function") {
    return String(obj);
  }
  
  // Prevent circular references
  if (seen.has(obj)) return "[Circular]";
  seen.add(obj);
  
  // Stop at max depth
  if (level >= depth) return "[Max Depth Reached]";
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const items = obj.map(item => deepInspect(item, depth, new Set(seen), level + 1));
    return `[${items.join(', ')}]`;
  }
  
  // Handle functions
  if (typeof obj === "function") {
    return `[Function: ${obj.name || 'anonymous'}]`;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return `Date(${obj.toISOString()})`;
  }
  
  // Handle DOM nodes in browser environment
  if (typeof window !== 'undefined' && obj instanceof Node) {
    return `[${obj.nodeName}${obj.id ? ' id="' + obj.id + '"' : ''}]`;
  }
  
  // Handle other objects
  const indent = '  '.repeat(level + 1);
  const entries = Object.entries(obj).map(([key, value]) => {
    const valueStr = deepInspect(value, depth, new Set(seen), level + 1);
    return `${indent}${key}: ${valueStr}`;
  });
  
  return entries.length 
    ? `{\n${entries.join(',\n')}\n${'  '.repeat(level)}}` 
    : '{}';
}

/**
 * Logs a deep inspection of an object to the console
 * 
 * @param {any} obj - The object to inspect
 * @param {string} [label] - Optional label for the output
 * @param {number} [depth=5] - Maximum depth to traverse
 */
export function logDeep(obj, label = 'Object', depth = 5) {
  console.log(`${label}:`, deepInspect(obj, depth));
}

/**
 * Returns all properties of an object including non-enumerable ones and those in the prototype chain
 * 
 * @param {any} obj - The object to inspect
 * @returns {string[]} - Array of all property names
 */
export function getAllProperties(obj) {
  if (obj === null || obj === undefined) {
    return [];
  }
  
  let props = new Set();
  let currentObj = obj;
  
  do {
    Object.getOwnPropertyNames(currentObj).forEach(prop => props.add(prop));
  } while ((currentObj = Object.getPrototypeOf(currentObj)) && 
           currentObj !== Object.prototype);
  
  return Array.from(props);
}

/**
 * Creates a developer-friendly dump of an object to debug in React Developer Tools
 * by adding a __debug property that won't interfere with normal operations
 * 
 * @param {any} obj - The object to debug
 * @returns {object} - The original object with a __debug property
 */
export function createDebugProxy(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  return {
    ...obj,
    __debug: {
      allProps: getAllProperties(obj),
      fullInspection: deepInspect(obj, 10)
    }
  };
}