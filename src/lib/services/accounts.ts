import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../auth/password";
import type { RoleId } from "../agents";

export function getUserByUsername(username: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.username, username)).get();
}

export function getUserById(id: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function listAllAccounts() {
  const db = getDb();
  return db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    role: users.role,
    className: users.className,
    title: users.title,
    disabled: users.disabled,
    createdAt: users.createdAt,
  }).from(users).all();
}

export async function createAccount(input: {
  username: string;
  password: string;
  name: string;
  role: RoleId;
  className?: string;
  title?: string;
}) {
  const db = getDb();
  const existing = getUserByUsername(input.username);
  if (existing) return null;

  const passwordHash = await hashPassword(input.password);
  const id = `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  db.insert(users).values({
    id,
    username: input.username,
    passwordHash,
    name: input.name,
    role: input.role,
    className: input.className || "",
    title: input.title || "",
  }).run();

  return getUserById(id);
}

export async function updateAccount(id: string, updates: {
  name?: string;
  role?: RoleId;
  className?: string;
  title?: string;
  disabled?: boolean;
  password?: string;
}) {
  const db = getDb();
  const user = getUserById(id);
  if (!user) return null;

  const values: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (updates.name !== undefined) values.name = updates.name;
  if (updates.role !== undefined) values.role = updates.role;
  if (updates.className !== undefined) values.className = updates.className;
  if (updates.title !== undefined) values.title = updates.title;
  if (updates.disabled !== undefined) values.disabled = updates.disabled;
  if (updates.password) values.passwordHash = await hashPassword(updates.password);

  db.update(users).set(values).where(eq(users.id, id)).run();
  return getUserById(id);
}

export function deleteAccount(id: string) {
  const db = getDb();
  db.delete(users).where(eq(users.id, id)).run();
  return true;
}

export async function validateLogin(username: string, password: string) {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (user.disabled) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as RoleId,
    className: user.className,
    title: user.title,
  };
}
