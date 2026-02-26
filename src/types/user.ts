export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: number; // Using require for images returns a number in React Native
}
