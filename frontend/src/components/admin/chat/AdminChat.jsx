import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getMessages, sendMessage, markAsRead } from '../../../services/chatService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AdminChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    const userMessages = messages.filter(msg => 
      (msg.sender._id === userId && msg.receiver._id === user._id) || 
      (msg.sender._id === user._id && msg.receiver._id === userId)
    );
    if (userMessages.length > 0) {
      await markAsRead(userMessages[0]._id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const messageData = {
        content: newMessage,
        receiverId: selectedUser
      };
      const sentMessage = await sendMessage(messageData);
      setNewMessage('');
      if (sentMessage) {
        setMessages(prevMessages => [...prevMessages, sentMessage]);
      }
      await fetchMessages();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  // Get unique users from messages (only users who have ever messaged with admin)
  const uniqueUsers = [...new Set(messages
    .filter(msg => msg.sender._id === user._id || msg.receiver._id === user._id)
    .map(msg => msg.sender._id === user._id ? msg.receiver._id : msg.sender._id)
  )].map(userId => {
    const userMessage = messages.find(msg => 
      (msg.sender._id === userId && msg.receiver._id === user._id) || 
      (msg.sender._id === user._id && msg.receiver._id === userId)
    );
    return {
      _id: userId,
      name: userMessage.sender._id === userId ? userMessage.sender.name : userMessage.receiver.name,
      email: userMessage.sender._id === userId ? userMessage.sender.email : userMessage.receiver.email
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg">
      {/* Users Sidebar */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h3 className="font-semibold">Users</h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {uniqueUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => handleUserSelect(user._id)}
              className={`w-full p-3 text-left hover:bg-gray-100 ${
                selectedUser === user._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{user.name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {selectedUser && (
                <>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {uniqueUsers.find(u => u._id === selectedUser)?.name[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {uniqueUsers.find(u => u._id === selectedUser)?.name || 'User'}
                    </h2>
                    <p className="text-sm text-blue-100">Online</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {selectedUser ? (
            messages
              .filter(msg => 
                (msg.sender._id === selectedUser && msg.receiver._id === user._id) || 
                (msg.sender._id === user._id && msg.receiver._id === selectedUser)
              )
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map((message, index, filteredMessages) => {
                const isSameSender = index > 0 && filteredMessages[index - 1].sender._id === message.sender._id;
                const showTimestamp = index === filteredMessages.length - 1 || 
                  filteredMessages[index + 1].sender._id !== message.sender._id;
                const isAdminMessage = message.sender._id === user._id;

                return (
                  <div
                    key={message._id}
                    className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'} ${
                      isSameSender ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    <div className="flex flex-col max-w-[70%]">
                      <div
                        className={`rounded-lg p-3 ${
                          isAdminMessage
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {showTimestamp && (
                        <span className={`text-xs mt-1 ${isAdminMessage ? 'text-right' : 'text-left'} text-gray-500`}>
                          {format(new Date(message.timestamp), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a user to view messages
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
              placeholder={selectedUser ? "Type your message..." : "Select a user to send message"}
              disabled={!selectedUser}
              className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!selectedUser}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminChat; 