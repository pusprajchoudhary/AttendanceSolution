import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMessages, sendMessage } from '../../services/chatService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const UserChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const isFirstRender = useRef(true);
  const prevMessagesLength = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMessagesLength.current = messages.length;
      return;
    }
    // Only scroll if a new message was added
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      if (data) {
        setMessages(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage,
        receiverId: '6810d325ebff7f699144b6fa' // Correct admin ID
      };
      
      await sendMessage(messageData);
      setNewMessage('');
      fetchMessages();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

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
      <div className="p-4 border-b bg-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-blue-600 font-bold">A</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Admin Support</h2>
            <p className="text-sm text-blue-100">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isSameSender = index > 0 && messages[index - 1].sender._id === message.sender._id;
            const showTimestamp = index === messages.length - 1 || 
              messages[index + 1].sender._id !== message.sender._id;
            const isAdminMessage = message.sender._id === '6810d325ebff7f699144b6fa';

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
                      {format(new Date(message.timestamp), 'h:mm a')}
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
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserChat; 