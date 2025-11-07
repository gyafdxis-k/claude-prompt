import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  templateId: string;
  templateName: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  
  currentConversation: Conversation | null;
  setCurrentConversation: (conv: Conversation | null) => void;
  
  conversations: Conversation[];
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  
  addMessage: (message: Message) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      
      selectedTemplateId: null,
      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
      
      currentConversation: null,
      setCurrentConversation: (conv) => set({ currentConversation: conv }),
      
      conversations: [],
      addConversation: (conv) => 
        set((state) => ({ 
          conversations: [conv, ...state.conversations],
          currentConversation: conv
        })),
      
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
          currentConversation:
            state.currentConversation?.id === id
              ? { ...state.currentConversation, ...updates, updatedAt: Date.now() }
              : state.currentConversation
        })),
      
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversation:
            state.currentConversation?.id === id ? null : state.currentConversation
        })),
      
      addMessage: (message) =>
        set((state) => {
          if (!state.currentConversation) return state;
          
          const updatedConv = {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, message],
            updatedAt: Date.now()
          };
          
          return {
            currentConversation: updatedConv,
            conversations: state.conversations.map((c) =>
              c.id === updatedConv.id ? updatedConv : c
            )
          };
        })
    }),
    {
      name: 'claude-dev-assistant-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        conversations: state.conversations
      })
    }
  )
);
