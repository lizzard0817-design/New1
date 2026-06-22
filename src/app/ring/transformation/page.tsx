"use client";
import { ProtectedRoute } from "@/components/layout";
import { TransformationPage } from "@/components/rings/transformation-page";

export default function Transformation() {
  return <ProtectedRoute permission="trackTransformation"><TransformationPage /></ProtectedRoute>;
}
