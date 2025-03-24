"use client";

import { useState, useEffect } from "react";

export function DebugPanel() {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...");
  const [apiResponse, setApiResponse] = useState<string>("");
  const [showPanel, setShowPanel] = useState<boolean>(false);

  useEffect(() => {
    // Get the API URL from environment
    const url = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
    setApiUrl(url || "Not set");
    
    // Check if API key is set (don't show the actual key)
    const key = process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY;
    setApiKey(key ? "Set (hidden)" : "Not set");
    
    // Test the connection to the API
    const testConnection = async () => {
      try {
        const response = await fetch(`${url}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(key && { "Authorization": `Bearer ${key}` })
          }
        });
        
        if (response.ok) {
          setConnectionStatus("Connected ✅");
          const data = await response.text();
          setApiResponse(data);
        } else {
          setConnectionStatus(`Error: ${response.status} ${response.statusText} ❌`);
        }
      } catch (error) {
        setConnectionStatus(`Connection failed: ${error.message} ❌`);
      }
    };
    
    if (url) {
      testConnection();
    } else {
      setConnectionStatus("No API URL provided ❌");
    }
  }, []);

  return (
    <>
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded z-50"
      >
        {showPanel ? "Hide Debug" : "Debug"}
      </button>
      
      {showPanel && (
        <div className="fixed top-14 right-4 bg-gray-800 text-white p-4 rounded shadow-lg z-50 max-w-md overflow-auto max-h-[80vh]">
          <h3 className="text-lg font-bold mb-2">LangGraph Connection Debug</h3>
          
          <div className="mb-4">
            <div className="font-semibold">API URL:</div>
            <div className="text-sm break-all bg-gray-700 p-2 rounded">{apiUrl}</div>
          </div>
          
          <div className="mb-4">
            <div className="font-semibold">API Key:</div>
            <div className="text-sm bg-gray-700 p-2 rounded">{apiKey}</div>
          </div>
          
          <div className="mb-4">
            <div className="font-semibold">Connection Status:</div>
            <div className="text-sm bg-gray-700 p-2 rounded">{connectionStatus}</div>
          </div>
          
          {apiResponse && (
            <div>
              <div className="font-semibold">API Response:</div>
              <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-[200px]">
                {apiResponse}
              </pre>
            </div>
          )}
          
          <div className="mt-4">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </>
  );
} 