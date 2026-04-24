import { fetchUserCategories } from "@/src/lib/actions"
import { CategoriesShell } from "@/src/components/categories/categories-shell"

export default async function CategoriesPage() {
  const categories = await fetchUserCategories()
  return <CategoriesShell categories={categories} />
}
