import type { Metadata } from "next";
import ProfilePage from "@/components/auth/ProfilePage";
export const metadata: Metadata = { title: "Hồ sơ" };
export default function ProfileRoute() { return <ProfilePage />; }
