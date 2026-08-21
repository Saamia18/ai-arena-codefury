import type { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
}
