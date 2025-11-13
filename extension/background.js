let ws = null;
let isConnected = false;
let pendingRequests = new Map();

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Bridge] Extension installed');
  chrome.storage.local.set({ 
    wsUrl: 'ws://localhost:8765',
    enabled: true 
  });
});

function connectWebSocket() {
  chrome.storage.local.get(['wsUrl'], (result) => {
    const wsUrl = result.wsUrl || 'ws://localhost:8765';
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[Bridge] Connected to local server');
        isConnected = true;
        updateIcon('connected');
      };
      
      ws.onclose = () => {
        console.log('[Bridge] Disconnected from local server');
        isConnected = false;
        updateIcon('disconnected');
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('[Bridge] WebSocket error:', error);
        isConnected = false;
        updateIcon('error');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'tool_response') {
            const response = message.payload;
            const pending = pendingRequests.get(response.id);
            
            if (pending) {
              pending.resolve(response);
              pendingRequests.delete(response.id);
            }
          }
        } catch (error) {
          console.error('[Bridge] Message parse error:', error);
        }
      };
    } catch (error) {
      console.error('[Bridge] Connection error:', error);
      setTimeout(connectWebSocket, 5000);
    }
  });
}

function updateIcon(status) {
  const iconPath = status === 'connected' ? 'icon48.png' : 'icon48-gray.png';
  chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'tool_request') {
    if (!isConnected) {
      sendResponse({ 
        success: false, 
        error: 'Not connected to local server' 
      });
      return true;
    }
    
    const requestId = crypto.randomUUID();
    
    const promise = new Promise((resolve) => {
      pendingRequests.set(requestId, { resolve });
      
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          resolve({ success: false, error: 'Request timeout' });
        }
      }, 30000);
    });
    
    ws.send(JSON.stringify({
      type: 'tool_request',
      payload: {
        id: requestId,
        tool: request.tool,
        parameters: request.parameters
      }
    }));
    
    promise.then(sendResponse);
    return true;
  }
  
  if (request.type === 'get_status') {
    sendResponse({ connected: isConnected });
    return true;
  }
});

connectWebSocket();
