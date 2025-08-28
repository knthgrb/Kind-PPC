"use client";
import { useState, useEffect } from "react";
import { LuSearch } from "react-icons/lu";
import { FaChevronLeft } from "react-icons/fa";
import LimitAlertModal from "@/components/LimitAlertModal";
import { chatData } from "@/lib/chat";

const formatSidebarTime = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    if (diff < 1) return "just now";
    if (diff < 2) return `${diff} min ago`;
    return `${diff} mins ago`;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Utility: Format chat timestamp
const formatChatTime = (date: Date): string =>
  `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )} ${date.getHours() >= 12 ? "PM" : "AM"}`;

export default function ChatUI() {
  const currentUser = chatData.participants[0]; // Logged-in user (Darrell)
  const [activeUser, setActiveUser] = useState(chatData.participants[1]);
  const [messages, setMessages] = useState<Message[]>(
    chatData.conversations[activeUser.id] || []
  );
  const [newMessage, setNewMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMessages(chatData.conversations[activeUser.id] || []);
  }, [activeUser]);
  const [modalOpen, setModalOpen] = useState(false);

  const getStatusColor = (status: Status): string => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-orange-400";
      default:
        return "bg-gray-400";
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const now = new Date();
    const newMsg: Message = {
      id: messages.length + 1,
      senderId: currentUser.id,
      message: newMessage,
      time: now,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    chatData.conversations[activeUser.id] = updated;
    setNewMessage("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl xl:max-w-7xl shadow-xl/20 rounded-xl">
      <div className="flex h-[85vh]">
        {/* Sidebar */}
        <div
          className={`w-64 p-3 flex-col shadow-[2px_0_3px_-2px_rgba(0,0,0,0.25)] z-20
        ${sidebarOpen ? "flex" : "hidden"} md:flex`}
        >
          {/* Search */}
          <div className="flex items-center gap-2 mb-3 bg-[#eeeef1] px-3 py-2 rounded-lg border border-dashed border-gray-300">
            <LuSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search here..."
              className="flex-1 bg-transparent text-[0.669rem] text-[#55585b] outline-none"
            />
          </div>
          <p className="text-[0.663rem] text-[#8D8D8D] mb-2">Recent Chats</p>
          <div className="overflow-y-auto">
            {chatData.participants
              .filter((u) => u.id !== currentUser.id)
              .map((user) => {
                const lastMsg = (chatData.conversations[user.id] || []).slice(
                  -1
                )[0];
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setActiveUser(user);
                      setSidebarOpen(false); // close on mobile
                    }}
                    className={`flex items-center p-2 mb-2 cursor-pointer border-b border-[#DCDCE2] hover:bg-gray-200 ${
                      activeUser.id === user.id ? "bg-[#f0e7f2]" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                          user.status
                        )}`}
                      />
                    </div>
                    <div className="ml-2 flex-1 min-w-0">
                      <h4 className="text-[0.663rem] font-medium text-[#212529] truncate">
                        {user.name}
                      </h4>
                      <p className="text-[0.663rem] text-[#757589] truncate">
                        {lastMsg
                          ? `${
                              lastMsg.senderId === currentUser.id ? "You: " : ""
                            }${lastMsg.message}`
                          : "No messages yet"}
                      </p>
                    </div>
                    <span className="text-[0.663rem] text-[#757589] ml-1 whitespace-nowrap">
                      {lastMsg ? formatSidebarTime(lastMsg.time) : ""}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              {/* Mobile back/hamburger */}
              <button
                className="md:hidden mr-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <FaChevronLeft className="text-gray-600 w-4 h-4" />
              </button>
              <div className="relative">
                <img
                  src={activeUser.image}
                  alt={activeUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                    activeUser.status
                  )}`}
                />
              </div>
              <div className="ml-3">
                <h3 className="text-[0.663rem] font-medium text-[#212529]">
                  {activeUser.name}
                </h3>
                <p className="text-[0.663rem] text-[#757589]">
                  {activeUser.status === "online"
                    ? "Online"
                    : activeUser.status === "away"
                    ? "Away"
                    : "Offline"}
                </p>
              </div>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-2">
              <div
                className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                <img src="/icons/info.png" alt="info" className="w-4 h-4" />
              </div>
              <div
                className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                <img src="/icons/menubar.png" alt="menu" className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa] mr-1 mb-2">
            {messages.map((msg) => {
              const isSent = msg.senderId === currentUser.id;
              const sender = chatData.participants.find(
                (p) => p.id === msg.senderId
              );
              if (!sender) return null;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end ${
                    isSent ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isSent && (
                    <img
                      src={sender.image}
                      alt={sender.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-3xl ${
                      isSent
                        ? "bg-[#CC0000] text-white rounded"
                        : "bg-white text-[#757589] rounded"
                    }`}
                  >
                    <p
                      className={`text-[0.663rem] mt-1 pb-3 flex items-center justify-between ${
                        isSent ? "text-white" : "text-[#757589]"
                      }`}
                    >
                      <span className="!font-bold">{sender.name}</span>
                      <span>{formatChatTime(msg.time)}</span>
                    </p>
                    <p className="text-[0.663rem]">{msg.message}</p>
                  </div>
                  {isSent && (
                    <img
                      src={sender.image}
                      alt={sender.name}
                      className="w-8 h-8 rounded-full ml-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <hr className="text-gray-200" />
          {/* Input */}
          <div className="p-3 flex items-center gap-2 bg-[#f5f6fa]">
            {/* plus icon */}
            <img
              src="/icons/plus.png"
              alt="plus"
              className="ml-2 w-4 h-4 cursor-pointer"
            />

            {/* message input */}
            <div className="flex-1 flex items-center px-2">
              <input
                type="text"
                placeholder="Type message here..."
                className="flex-1 p-2 outline-none text-[0.663rem] text-[#757589]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <img
                src="/icons/emoji.png"
                alt="emoji"
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            {/* send icon */}
            <div
              className="bg-red-500 rounded-sm w-[40px] h-[40px] flex items-center justify-center cursor-pointer"
              onClick={sendMessage}
            >
              <img src="/icons/send.png" alt="send" className="w-3 h-4" />
            </div>
          </div>
        </div>
      </div>

      <LimitAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={() => {
          setModalOpen(false);
        }}
        plan="Silver Plan"
      />
    </div>
  );
}
