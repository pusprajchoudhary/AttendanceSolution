import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getMessages, getAdminId } from '../../../services/chatService';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';

const UserChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user?._id) {
      initializeChat();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const initializeChat = async () => {
    try {
      console.log('Initializing chat...');
      const adminId = await getAdminId();
      console.log('Admin ID received in component:', adminId);
      setAdminId(adminId);
      await fetchMessages();
    } catch (error) {
      console.error('Error initializing chat:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to initialize chat: ' + error.message);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?._id || !adminId) {
      console.log('Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        hasUserId: !!user?._id,
        hasAdminId: !!adminId
      });
      return;
    }

    try {
      console.log('Sending message with data:', {
        content: newMessage.substring(0, 50),
        receiverId: adminId,
        userId: user._id
      });

      const messageData = {
        content: newMessage,
        receiverId: adminId
      };
      
      await sendMessage(messageData);
      setNewMessage('');
      await fetchMessages();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || 'Failed to send message');
    }
  };

  if (!user?._id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to use the chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <h2 className="text-lg font-semibold">Chat with Admin</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isSameSender = index > 0 && messages[index - 1].sender._id === message.sender._id;
            const showTimestamp = index === messages.length - 1 || 
              messages[index + 1].sender._id !== message.sender._id;
            const isAdminMessage = message.sender._id === adminId;

            return (
              <div
                key={message._id}
                className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'} ${
                  isSameSender ? 'mt-1' : 'mt-4'
                }`}
              >
                <div className="flex flex-col max-w-[70%]">
                  <div
                    className={`rounded-lg p-3 ${
                      isAdminMessage
                        ? 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        : 'bg-blue-500 text-white rounded-br-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {showTimestamp && (
                    <span className={`text-xs mt-1 ${isAdminMessage ? 'text-left' : 'text-right'} text-gray-500`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserChat; 