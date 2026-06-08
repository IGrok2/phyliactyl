import { appHandler } from "@/lib/pterodactyl/bff"
import { getEgg } from "@/lib/pterodactyl/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nest: string; egg: string }> },
) {
  const { nest, egg } = await params
  return appHandler(async () => {
    const res = await getEgg(Number(nest), Number(egg))
    const a = res.attributes
    return {
      id: String(a.id),
      name: a.name,
      description: a.description ?? "",
      author: a.author,
      startup: a.startup,
      dockerImage: a.docker_image,
      dockerImages: a.docker_images ?? {},
      variables: (a.relationships?.variables?.data ?? []).map((v) => ({
        name: v.attributes.name,
        description: v.attributes.description ?? "",
        envVariable: v.attributes.env_variable,
        defaultValue: v.attributes.default_value ?? "",
        userEditable: v.attributes.user_editable,
        rules: v.attributes.rules,
      })),
    }
  })
}
