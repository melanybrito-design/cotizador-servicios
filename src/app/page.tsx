import { redirect } from "next/navigation";
import { authenticated } from "@/server/auth";
import Workspace from "@/components/Workspace";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!(await authenticated())) redirect("/login");
  return <Workspace />;
}
