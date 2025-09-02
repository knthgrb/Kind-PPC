export type Role = "kindbossing" | "kindtao";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  image: string;
  role: Role;
};
