export const chatData: {
  participants: Participant[];
  conversations: Record<number, Message[]>;
} = {
  participants: [
    {
      id: 1,
      name: "Darrell Steward",
      image: "/people/darrellSteward.png",
      status: "online",
    },
    {
      id: 2,
      name: "Theresa Webb",
      image: "/people/theresaWebb.png",
      status: "online",
    },
    {
      id: 3,
      name: "Esther Howard",
      image: "/people/estherHoward.png",
      status: "away",
    },
    {
      id: 4,
      name: "Jane Cooper",
      image: "/people/janeCooper.png",
      status: "offline",
    },
  ],
  conversations: {
    2: [
      {
        id: 1,
        senderId: 2,
        message: "Hey, I'm looking to redesign my website. Can you help me? 😊",
        time: new Date(),
      },
      {
        id: 2,
        senderId: 1,
        message:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum..",
        time: new Date(),
      },
    ],
    3: [
      {
        id: 1,
        senderId: 3,
        message:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum..",
        time: new Date(),
      },
    ],
    4: [],
  },
};
