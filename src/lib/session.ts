import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

export function useSessionTermination() {
  const { signOut } = useClerk();
  const router = useRouter();

  const terminateSession = async (reason: string = "Account verification required") => {
    try {
      // Clear any local storage or state as needed
      localStorage.removeItem('cart_session_id');
      
      // Show informative message
      toast.info(reason + ". Please sign in again.");
      
      // Sign out and redirect
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error during session termination:', error);
      // Fallback: force redirect
      window.location.href = '/sign-in';
    }
  };

  return { terminateSession };
}