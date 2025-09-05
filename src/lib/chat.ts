import type { ChatParticipant, LegacyMessage } from "@/types/chat";

// Legacy chat data for mock/development purposes
// This can be removed once you're using real data from the database
export const chatData: {
  participants: ChatParticipant[];
  conversations: Record<string, LegacyMessage[]>;
} = {
  participants: [
    {
      id: "1",
      name: "Darrell Steward",
      image: "/people/darrellSteward.png",
      role: "kindbossing",
      isOnline: true,
    },
    {
      id: "2",
      name: "Theresa Webb",
      image: "/people/theresaWebb.png",
      role: "kindtao",
      isOnline: true,
    },
    {
      id: "3",
      name: "Esther Howard",
      image: "/people/estherHoward.png",
      role: "kindtao",
      isOnline: false,
    },
    {
      id: "4",
      name: "Jane Cooper",
      image: "/people/janeCooper.png",
      role: "kindbossing",
      isOnline: false,
    },
  ],
  conversations: {
    "22222222-2222-2222-2222-222222222222": [
      {
        id: 1,
        senderId: 2,
        message:
          "Hi, I saw your profile. Are you available for a full-time yaya position?",
        time: new Date(),
      },
      {
        id: 2,
        senderId: 1,
        message:
          "Yes, I am available. Could you tell me more about the work schedule?",
        time: new Date(),
      },
    ],
    "6b3ee30c-e13c-4503-aa53-56af804e3308": [
      {
        id: 1,
        senderId: 3,
        message:
          "Hello! Thank you for considering me. I am available tomorrow afternoon or this weekend. What works best for you?",
        time: new Date(),
      },
      {
        id: 2,
        senderId: 1,
        message:
          "Tomorrow afternoon at 2 PM would be perfect. Can you come to our house in Quezon City?",
        time: new Date(),
      },
    ],
  },
};
