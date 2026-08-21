import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { AuthUser } from "@/types/api";
import type { UserDocument } from "@/types/auth";

const USERS_COLLECTION = "users";

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const database = await getDatabase();
  const collection = database.collection<UserDocument>(USERS_COLLECTION);
  await collection.createIndex({ email: 1 }, { unique: true });

  return collection;
}

export async function findUserByEmail(email: string) {
  const collection = await getUsersCollection();
  return collection.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(userId: string) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getUsersCollection();
  return collection.findOne({ _id: new ObjectId(userId) });
}

export async function createUser({
  email,
  passwordHash,
  name,
}: {
  email: string;
  passwordHash: string;
  name?: string;
}) {
  const collection = await getUsersCollection();
  const now = new Date();
  const result = await collection.insertOne({
    email: normalizeEmail(email),
    passwordHash,
    name,
    createdAt: now,
  });

  return {
    _id: result.insertedId,
    email: normalizeEmail(email),
    passwordHash,
    name,
    createdAt: now,
  };
}

export function toAuthUser(user: WithId<UserDocument>): AuthUser {
  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
