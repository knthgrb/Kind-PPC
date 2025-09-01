type Status = "online" | "away" | "offline";

type Participant = {
  id: number;
  name: string;
  image: string;
  status: Status;
};

type Message = {
  id: number;
  senderId: number;
  message: string;
  time: Date;
};
