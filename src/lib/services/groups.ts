import { getDb } from "../db";
import { classGroups, classGroupMembers } from "../db/schema";
import { eq } from "drizzle-orm";

export function listGroups() {
  const db = getDb();
  const groups = db.select().from(classGroups).all();
  return groups.map((g) => {
    const members = db.select({ userId: classGroupMembers.userId }).from(classGroupMembers).where(eq(classGroupMembers.groupId, g.id)).all().map((m) => m.userId);
    return { ...g, members };
  });
}

export function createGroup(name: string) {
  const db = getDb();
  const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.insert(classGroups).values({ id, name }).run();
  return db.select().from(classGroups).where(eq(classGroups.id, id)).get();
}

export function setGroupMembers(groupId: string, userIds: string[]) {
  const db = getDb();
  db.delete(classGroupMembers).where(eq(classGroupMembers.groupId, groupId)).run();
  for (const userId of userIds) {
    db.insert(classGroupMembers).values({ groupId, userId }).run();
  }
  return listGroups().find((g) => g.id === groupId);
}

export function deleteGroup(groupId: string) {
  const db = getDb();
  db.delete(classGroups).where(eq(classGroups.id, groupId)).run();
  return true;
}
