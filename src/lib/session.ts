export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  const existingSessionId = localStorage.getItem('cart_session_id');
  if (existingSessionId) {
    return existingSessionId;
  }
  
  const newSessionId = generateSessionId();
  localStorage.setItem('cart_session_id', newSessionId);
  return newSessionId;
}