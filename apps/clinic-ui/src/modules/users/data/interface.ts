export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "invited";
}

export interface InviteUserInput {
  email: string;
  role: string;
}
