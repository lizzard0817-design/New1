import { getDb } from "../db";
import { reminders } from "../db/schema";
import { eq, and, lte } from "drizzle-orm";

export function getDueReminders(studentId: string) {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  return db.select().from(reminders)
    .where(and(eq(reminders.studentId, studentId), lte(reminders.dueDate, today), eq(reminders.status, "pending")))
    .all();
}

export function getAllDueReminders() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  return db.select().from(reminders)
    .where(and(lte(reminders.dueDate, today), eq(reminders.status, "pending")))
    .all();
}

export function markReminderNotified(id: string) {
  const db = getDb();
  db.update(reminders).set({ status: "notified" }).where(eq(reminders.id, id)).run();
}

export function markReminderResolved(id: string) {
  const db = getDb();
  db.update(reminders).set({ status: "resolved" }).where(eq(reminders.id, id)).run();
}
