// src/components/ChatTab/MessagePanel.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { MemberRole } from '@/types/room';
import TextareaAutosize from 'react-textarea-autosize';
import { useRoom } from '@/contexts/RoomContext';
import { ChatMessage } from '@/types/room';
import { ArrowUturnLeftIcon as ReplyIcon, XMarkIcon as XIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const getRoleColor = (role?: MemberRole) => {
  switch (role) {
    case 'Host':
      return 'text-yellow-400';
    case 'Moderator':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};


export default function ChatMessagesPanel() {
  const { messages, sendChatMessage } = useRoom();
  const [chatMessage, setChatMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // MODIFIED: Reverting to a single, more reliable useEffect for scrolling.
  // This directly manipulates the scroll position of the chat container itself,
  // preventing the entire page from scrolling. It runs whenever messages
  // are updated, solving the refresh issue correctly.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Set the container's scroll position to its maximum height.
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = () => {
    if (chatMessage.trim()) {
      sendChatMessage(
        chatMessage,
        replyingTo ? {
          messageId: replyingTo._id,
          senderName: replyingTo.senderName,
          content: replyingTo.content,
        } : undefined
      );
      setChatMessage('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    setChatMessage((prevMessage) => prevMessage + emoji.emoji);
  };

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="chat-messages-container flex-1 px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent min-h-0 overflow-y-auto"
      >
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <div
              key={msg._id || `system-${i}`}
              className="group relative text-base break-words hover:bg-gray-800/50 rounded-md p-1 -m-1 transition-colors"
            >
              {msg.type === 'system' ? (
                <p className="text-gray-400 italic">{msg.content}</p>
              ) : (
                <div>
                  {msg.replyTo && (
                    <div className="pl-2 ml-1 border-l-2 border-gray-600 mb-1 opacity-80">
                      <p className="text-xs font-semibold" style={{ color: '#aaa' }}>
                        {msg.replyTo.senderName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{msg.replyTo.content}</p>
                    </div>
                  )}
                  <p className="ml-1">
                    <span className={`font-semibold ${getRoleColor(msg.senderRole)}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-gray-200">: {msg.content}</span>
                  </p>
                </div>
              )}
              {msg.type === 'user' && (
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="absolute top-1/2 -translate-y-1/2 right-2 p-1 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  title="Reply"
                >
                  <ReplyIcon className="h-4 w-4 text-gray-300" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-base">No messages yet. Start chatting!</p>
          </div>
        )}
        {/* The marker div is no longer needed for scrolling */}
      </div>

      <div className="border-t border-gray-800 bg-[#1e1e1e] px-4 pt-3 pb-3 flex flex-col">
        {/* AnimatePresence and replyingTo section remains the same */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: '8px' }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#2a2a2a] p-2 rounded-lg border border-gray-700 relative overflow-hidden"
            >
              <p className="text-sm font-semibold text-gray-300">Replying to {replyingTo.senderName}</p>
              <p className="text-sm text-gray-400 truncate">{replyingTo.content}</p>
              <button
                onClick={() => setReplyingTo(null)}
                className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-600"
                title="Cancel reply"
              >
                <XIcon className="h-4 w-4 text-gray-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative" ref={emojiPickerRef}>
          {showEmojiPicker && (
            // MODIFIED: Added onWheel event to stop scroll propagation
            <div
              className="absolute bottom-14 right-0 z-50"
              onWheel={(e) => e.stopPropagation()}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                theme={Theme.DARK}
                lazyLoadEmojis={true}
                height={350}
                width={300}
              />
            </div>
          )}

          <div className="flex items-end gap-2">
            <TextareaAutosize
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={replyingTo ? 'Write a reply...' : 'Type your message...'}
              maxRows={4}
              className="flex-1 rounded-lg bg-[#2a2a2a] border border-gray-600 px-4 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-none"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-lg hover:bg-gray-700 transition"
              title="Add emoji"
            >
              <FaceSmileIcon className="h-6 w-6 text-gray-400" />
            </button>
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-4 py-2 rounded-lg transition self-stretch"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}