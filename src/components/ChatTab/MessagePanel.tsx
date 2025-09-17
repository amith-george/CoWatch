// MessagePanel.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, MemberRole } from '@/types/room';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatMessagesPanelProps {
  messages: ChatMessage[];
  sendChatMessage: (msg: string) => void;
}

// Helper function to determine username color based on role
const getRoleColor = (role?: MemberRole) => {
  switch (role) {
    case 'Host':
      return 'text-yellow-400';
    case 'Moderator':
      return 'text-blue-400';
    default:
      // Fallback color for 'Participant' or undefined roles
      return 'text-gray-400';
  }
};

export default function ChatMessagesPanel({ messages, sendChatMessage }: ChatMessagesPanelProps) {
  const [chatMessage, setChatMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  const handleSend = () => {
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNewMessageAdded = messages.length > prevMessagesCountRef.current;
    if (isNewMessageAdded) {
      requestAnimationFrame(() => {
        const isScrolledNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
        if (isScrolledNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  return (
    <div className="relative h-full flex flex-col">
      <div 
        ref={messagesContainerRef}
        // --- FIX: Conditionally set overflow to prevent scrolling when empty ---
        className={`chat-messages-container flex-1 px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent min-h-0 ${
          messages.length > 0 ? 'overflow-y-auto' : 'overflow-y-hidden'
        }`}
        style={{ scrollBehavior: 'smooth' }}
      >  
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <div key={i} className="text-base break-words">
              {msg.type === 'system' ? (
                <p className="text-gray-400 italic">{msg.text}</p>
              ) : (
                <p>
                  <span className={`font-semibold ${getRoleColor(msg.role)}`}>
                    {msg.username}
                  </span>
                  <span className="text-gray-200">: {msg.text}</span>
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-base">No messages yet. Start chatting!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 bg-[#1e1e1e] px-4 py-3 flex items-center gap-2">
        <TextareaAutosize
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          maxRows={4}
          className="flex-1 rounded-lg bg-[#2a2a2a] border border-gray-600 px-4 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-none"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-4 py-2 rounded-lg transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}