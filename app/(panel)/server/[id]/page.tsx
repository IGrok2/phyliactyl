import { ConsoleView } from "@/components/panel/console-view"

export default async function ServerConsolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConsoleView serverId={id} />
}
