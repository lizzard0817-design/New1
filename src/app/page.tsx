"use client";
import { ProtectedRoute } from "@/components/layout";
import { PageShell } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function Dashboard() {
  const { currentRole } = useAuth();

  return (
    <ProtectedRoute permission="viewDashboard">
      <PageShell>
        {currentRole?.id === "admin" && <AdminDashboard />}
        {currentRole?.id === "teacher" && <TeacherDashboard />}
        {currentRole?.id === "student" && <StudentDashboard />}
      </PageShell>
    </ProtectedRoute>
  );
}
