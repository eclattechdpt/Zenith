import type { Tables } from "@/types/database"

// --- ROW TYPES (from database) ---

export type Product = Tables<"products">
export type ProductVariant = Tables<"product_variants">
export type Category = Tables<"categories">
export type VariantType = Tables<"variant_types">
export type VariantOption = Tables<"variant_options">
export type VariantOptionAssignment = Tables<"variant_option_assignments">
export type ProductImage = Tables<"product_images">
export type BundleItem = Tables<"bundle_items">
export type ProductCategory = Tables<"product_categories">

// --- COMPOSITE TYPES (queries with joins) ---

export type VariantOptionWithType = VariantOption & {
  variant_types: Pick<VariantType, "id" | "name"> | null
}

export type VariantAssignmentWithOption = {
  variant_options: VariantOptionWithType | null
}

export type ProductVariantWithOptions = ProductVariant & {
  variant_option_assignments: VariantAssignmentWithOption[]
}

export type CategoryWithCount = Category & {
  product_categories: { count: number }[]
}

export type VariantTypeWithOptions = VariantType & {
  variant_options: VariantOption[]
}

export type ProductCategoryWithName = {
  categories: Pick<Category, "id" | "name"> | null
}

export type BundleItemWithStock = {
  product_variant_id: string
  product_variants: {
    id: string
    stock: number
    name: string | null
    sku: string | null
    products: { name: string }
  }
}

export type ProductWithDetails = Product & {
  product_categories: ProductCategoryWithName[]
  product_variants: ProductVariantWithOptions[]
  product_images: ProductImage[]
  bundle_items: BundleItemWithStock[]
}

// --- HELPERS ---

export function getCategoryNames(
  productCategories: ProductCategoryWithName[] | undefined
): string {
  return (productCategories ?? [])
    .map((pc) => pc.categories?.name)
    .filter(Boolean)
    .join(", ")
}

export function getCategoryIds(
  productCategories: ProductCategoryWithName[] | undefined
): string[] {
  return (productCategories ?? [])
    .map((pc) => pc.categories?.id)
    .filter((id): id is string => !!id)
}
