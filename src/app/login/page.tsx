import { redirect } from "next/navigation";
import { authenticated, configured } from "@/server/auth";
import Login from "@/components/Login";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await authenticated()) redirect("/");
  return <Login configured={configured()} />;
}
