import IntakeForm from "@/components/IntakeForm";
import { getConfig } from "@/server/db";
export const dynamic = "force-dynamic";
export default async function Page() {
  const settings = await getConfig("settings");
  return <IntakeForm name={settings.name} />;
}
