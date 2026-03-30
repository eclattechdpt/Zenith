import type {
  ProductWithDetails,
  CategoryWithCount,
  VariantTypeWithOptions,
} from "./types"

// --- TENANT ---

const TENANT_ID = "817036a8-d5d3-4301-986c-451b865fbca1"
const USER_ID = "12e008c4-890e-4032-a22d-f6a52cf7ce0e"
const now = new Date().toISOString()

// --- VARIANT TYPES & OPTIONS ---

export const mockVariantTypes: VariantTypeWithOptions[] = [
  {
    id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90",
    tenant_id: TENANT_ID,
    name: "Tono",
    sort_order: 1,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    variant_options: [
      { id: "5da4c894-e1fb-975f-52e2-fbcedf7a1a9d", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Red Lacquer", color_hex: "#C41E3A", sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "ff955ea4-d022-44eb-1a32-625fb3193b7f", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Pink in the Afternoon", color_hex: "#E8A0BF", sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "dff6215c-8385-11e3-334a-6440f497e60e", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Rum Raisin", color_hex: "#6B3A4A", sort_order: 3, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "77c8eb37-3e1a-e0a0-8777-c6c7738ff8f8", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Nude Attitude", color_hex: "#C4956A", sort_order: 4, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "187299d8-d76c-b947-3750-8a5f397b54d4", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Berry Rich", color_hex: "#8B2252", sort_order: 5, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "cc152b3e-a54d-b155-7c70-a66f97813bed", tenant_id: TENANT_ID, variant_type_id: "c97148a9-662e-b5d9-4cdf-d2649c6c2e90", value: "Coral Crush", color_hex: "#F08080", sort_order: 6, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
    ],
  },
  {
    id: "ed617a34-4872-79da-a727-7729c7da6687",
    tenant_id: TENANT_ID,
    name: "Tamano",
    sort_order: 2,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    variant_options: [
      { id: "f3d525aa-f919-6678-343b-ba3f40c4803c", tenant_id: TENANT_ID, variant_type_id: "ed617a34-4872-79da-a727-7729c7da6687", value: "15ml", color_hex: null, sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "7be05673-0dd8-ff5a-c5cf-67076df57490", tenant_id: TENANT_ID, variant_type_id: "ed617a34-4872-79da-a727-7729c7da6687", value: "30ml", color_hex: null, sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "c9f48fc5-8c6e-65af-9370-eb51f28985bb", tenant_id: TENANT_ID, variant_type_id: "ed617a34-4872-79da-a727-7729c7da6687", value: "50ml", color_hex: null, sort_order: 3, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "2bc64ea0-ff3d-bfa3-035c-6be98df61ed6", tenant_id: TENANT_ID, variant_type_id: "ed617a34-4872-79da-a727-7729c7da6687", value: "3.7g", color_hex: null, sort_order: 7, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
    ],
  },
  {
    id: "e935417f-dbb2-0064-f2bb-0a3c674cbb5d",
    tenant_id: TENANT_ID,
    name: "Formula",
    sort_order: 4,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    variant_options: [
      { id: "30aec087-3aae-3ae1-ab68-4b286c87952e", tenant_id: TENANT_ID, variant_type_id: "e935417f-dbb2-0064-f2bb-0a3c674cbb5d", value: "Mate", color_hex: null, sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "091cf751-3133-7141-4ef6-eebd768d584a", tenant_id: TENANT_ID, variant_type_id: "e935417f-dbb2-0064-f2bb-0a3c674cbb5d", value: "Glossy", color_hex: null, sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
      { id: "cca24228-3dc6-4f3b-2735-208a3d3a6a0d", tenant_id: TENANT_ID, variant_type_id: "e935417f-dbb2-0064-f2bb-0a3c674cbb5d", value: "Satinado", color_hex: null, sort_order: 3, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null },
    ],
  },
]

// --- CATEGORIES ---

export const mockCategories: CategoryWithCount[] = [
  { id: "13ff4e14-ed43-d382-bbaf-86595b4ba2a2", tenant_id: TENANT_ID, parent_id: null, name: "Maquillaje", slug: "maquillaje", description: null, sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 5 }] },
  { id: "93d7621a-0470-7145-99e0-3039151f8afd", tenant_id: TENANT_ID, parent_id: "13ff4e14-ed43-d382-bbaf-86595b4ba2a2", name: "Labiales", slug: "labiales", description: null, sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 3 }] },
  { id: "773e72b0-f9b8-fc2d-4978-44239ec20e16", tenant_id: TENANT_ID, parent_id: "13ff4e14-ed43-d382-bbaf-86595b4ba2a2", name: "Bases y correctores", slug: "bases-correctores", description: null, sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 2 }] },
  { id: "64795741-747d-a2cf-7712-2f7bbcfba7ae", tenant_id: TENANT_ID, parent_id: "13ff4e14-ed43-d382-bbaf-86595b4ba2a2", name: "Ojos", slug: "ojos", description: null, sort_order: 3, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 0 }] },
  { id: "c6ff3efb-d5c9-1eab-bda4-aa53fbe3f226", tenant_id: TENANT_ID, parent_id: null, name: "Skincare", slug: "skincare", description: null, sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 2 }] },
  { id: "48316cc2-4437-8aa3-6649-4bc40a8fec09", tenant_id: TENANT_ID, parent_id: "c6ff3efb-d5c9-1eab-bda4-aa53fbe3f226", name: "Limpieza", slug: "limpieza", description: null, sort_order: 1, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 1 }] },
  { id: "df073a9d-d8ae-a493-870b-81b425820b34", tenant_id: TENANT_ID, parent_id: "c6ff3efb-d5c9-1eab-bda4-aa53fbe3f226", name: "Tratamiento", slug: "tratamiento", description: null, sort_order: 2, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 1 }] },
  { id: "1687bc7e-d0d2-ba69-cae9-39b847bcbd5f", tenant_id: TENANT_ID, parent_id: null, name: "Cabello", slug: "cabello", description: null, sort_order: 3, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 1 }] },
  { id: "b8a8922e-fdf5-4d8e-3692-38698619b2ea", tenant_id: TENANT_ID, parent_id: null, name: "Fragancias", slug: "fragancias", description: null, sort_order: 4, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 1 }] },
  { id: "49e6e6e7-75a3-4698-5cbe-89b14748d66c", tenant_id: TENANT_ID, parent_id: null, name: "Unas", slug: "unas", description: null, sort_order: 5, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 0 }] },
  { id: "c42678e9-5c77-23a2-e93e-5d1814df247f", tenant_id: TENANT_ID, parent_id: null, name: "Accesorios", slug: "accesorios", description: null, sort_order: 6, created_at: now, updated_at: now, created_by: USER_ID, deleted_at: null, products: [{ count: 0 }] },
]

// --- PRODUCTS ---

function makeVariant(
  id: string,
  productId: string,
  sku: string,
  price: number,
  cost: number,
  stock: number,
  stockMin: number,
  options: { optionId: string; value: string; colorHex: string | null; typeName: string }[]
) {
  return {
    id,
    tenant_id: TENANT_ID,
    product_id: productId,
    sku,
    barcode: null,
    price,
    cost,
    stock,
    stock_min: stockMin,
    is_active: true,
    expires_at: null,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    variant_option_assignments: options.map((o) => ({
      variant_options: {
        id: o.optionId,
        tenant_id: TENANT_ID,
        variant_type_id: "",
        value: o.value,
        color_hex: o.colorHex,
        sort_order: 0,
        created_at: now,
        updated_at: now,
        created_by: USER_ID,
        deleted_at: null,
        variant_types: { id: "", name: o.typeName },
      },
    })),
  }
}

export const mockProducts: ProductWithDetails[] = [
  {
    id: "207ee539-7a84-b4e9-5885-e6dc6b761222",
    tenant_id: TENANT_ID,
    category_id: "93d7621a-0470-7145-99e0-3039151f8afd",
    name: "MAC Matte Lipstick",
    slug: "mac-matte-lipstick",
    description: "Labial mate de larga duracion con acabado aterciopelado",
    brand: "MAC",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "93d7621a-0470-7145-99e0-3039151f8afd", name: "Labiales" },
    product_images: [],
    product_variants: [
      makeVariant("e140464e-3d55-07f7-d4a7-2aa717790998", "207ee539-7a84-b4e9-5885-e6dc6b761222", "MAC-ML-RL", 450, 220, 24, 5, [
        { optionId: "5da4c894-e1fb-975f-52e2-fbcedf7a1a9d", value: "Red Lacquer", colorHex: "#C41E3A", typeName: "Tono" },
        { optionId: "2bc64ea0-ff3d-bfa3-035c-6be98df61ed6", value: "3.7g", colorHex: null, typeName: "Tamano" },
      ]),
      makeVariant("17b45e26-cd1d-77d5-23ed-7672726e1fd5", "207ee539-7a84-b4e9-5885-e6dc6b761222", "MAC-ML-PA", 450, 220, 18, 5, [
        { optionId: "ff955ea4-d022-44eb-1a32-625fb3193b7f", value: "Pink in the Afternoon", colorHex: "#E8A0BF", typeName: "Tono" },
        { optionId: "2bc64ea0-ff3d-bfa3-035c-6be98df61ed6", value: "3.7g", colorHex: null, typeName: "Tamano" },
      ]),
      makeVariant("e53db4b4-495d-b293-5cf6-55ae8333e5bc", "207ee539-7a84-b4e9-5885-e6dc6b761222", "MAC-ML-RR", 450, 220, 3, 5, [
        { optionId: "dff6215c-8385-11e3-334a-6440f497e60e", value: "Rum Raisin", colorHex: "#6B3A4A", typeName: "Tono" },
        { optionId: "2bc64ea0-ff3d-bfa3-035c-6be98df61ed6", value: "3.7g", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "a6b0618d-6c13-5ab9-f8e2-6366e18d554f",
    tenant_id: TENANT_ID,
    category_id: "93d7621a-0470-7145-99e0-3039151f8afd",
    name: "Revlon Super Lustrous Gloss",
    slug: "revlon-super-lustrous-gloss",
    description: "Gloss con brillo espejo y vitamina E",
    brand: "Revlon",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "93d7621a-0470-7145-99e0-3039151f8afd", name: "Labiales" },
    product_images: [],
    product_variants: [
      makeVariant("c193f102-37f7-dd2a-2c0a-ba21b8901756", "a6b0618d-6c13-5ab9-f8e2-6366e18d554f", "REV-SLG-CC", 280, 130, 15, 5, [
        { optionId: "cc152b3e-a54d-b155-7c70-a66f97813bed", value: "Coral Crush", colorHex: "#F08080", typeName: "Tono" },
      ]),
      makeVariant("8da61bab-690c-d2c3-4009-b6b06c6d1e21", "a6b0618d-6c13-5ab9-f8e2-6366e18d554f", "REV-SLG-NA", 280, 130, 12, 5, [
        { optionId: "77c8eb37-3e1a-e0a0-8777-c6c7738ff8f8", value: "Nude Attitude", colorHex: "#C4956A", typeName: "Tono" },
      ]),
    ],
  },
  {
    id: "01038ad6-2eed-fbe2-3175-3a2acb68910a",
    tenant_id: TENANT_ID,
    category_id: "773e72b0-f9b8-fc2d-4978-44239ec20e16",
    name: "Maybelline Fit Me Foundation",
    slug: "maybelline-fit-me-foundation",
    description: "Base liquida de cobertura natural con acabado mate",
    brand: "Maybelline",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "773e72b0-f9b8-fc2d-4978-44239ec20e16", name: "Bases y correctores" },
    product_images: [],
    product_variants: [
      makeVariant("39d9fcd9-56eb-aa2a-a994-728d1b782ea1", "01038ad6-2eed-fbe2-3175-3a2acb68910a", "MAY-FM-NAT", 320, 150, 20, 5, [
        { optionId: "a22b8cd2-15d3-cf5a-9a16-a20f3c0a29fe", value: "Natural", colorHex: "#E8C4A0", typeName: "Tono" },
        { optionId: "7be05673-0dd8-ff5a-c5cf-67076df57490", value: "30ml", colorHex: null, typeName: "Tamano" },
      ]),
      makeVariant("1611b199-1a26-eb71-abe4-fb7d0f7ca1e8", "01038ad6-2eed-fbe2-3175-3a2acb68910a", "MAY-FM-MED", 320, 150, 8, 5, [
        { optionId: "6c082dc2-16e2-9fa0-2231-cbd42f908384", value: "Medium", colorHex: "#D4A574", typeName: "Tono" },
        { optionId: "7be05673-0dd8-ff5a-c5cf-67076df57490", value: "30ml", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "a77028cd-e6bb-700e-afb9-8089069c5d70",
    tenant_id: TENANT_ID,
    category_id: "48316cc2-4437-8aa3-6649-4bc40a8fec09",
    name: "CeraVe Limpiadora Hidratante",
    slug: "cerave-limpiadora-hidratante",
    description: "Limpiadora facial con ceramidas y acido hialuronico",
    brand: "CeraVe",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "48316cc2-4437-8aa3-6649-4bc40a8fec09", name: "Limpieza" },
    product_images: [],
    product_variants: [
      makeVariant("3cfcb9d5-03b8-89bc-9510-fe39dafd85c6", "a77028cd-e6bb-700e-afb9-8089069c5d70", "CV-LH-50", 380, 190, 10, 3, [
        { optionId: "c9f48fc5-8c6e-65af-9370-eb51f28985bb", value: "50ml", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "a6a765e0-791f-17c9-4d75-18f6fe6f228a",
    tenant_id: TENANT_ID,
    category_id: "df073a9d-d8ae-a493-870b-81b425820b34",
    name: "The Ordinary Niacinamide 10%",
    slug: "the-ordinary-niacinamide",
    description: "Serum con niacinamida y zinc para control de poros y sebo",
    brand: "The Ordinary",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "df073a9d-d8ae-a493-870b-81b425820b34", name: "Tratamiento" },
    product_images: [],
    product_variants: [
      makeVariant("36294435-3526-16d8-488f-123381befcc3", "a6a765e0-791f-17c9-4d75-18f6fe6f228a", "TO-NIA-30", 250, 110, 30, 5, [
        { optionId: "7be05673-0dd8-ff5a-c5cf-67076df57490", value: "30ml", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "57c8e992-389b-1fdb-8169-acb27bf045ef",
    tenant_id: TENANT_ID,
    category_id: "1687bc7e-d0d2-ba69-cae9-39b847bcbd5f",
    name: "Olaplex No.3 Hair Perfector",
    slug: "olaplex-no3-hair-perfector",
    description: "Tratamiento reparador de enlaces para cabello danado",
    brand: "Olaplex",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "1687bc7e-d0d2-ba69-cae9-39b847bcbd5f", name: "Cabello" },
    product_images: [],
    product_variants: [
      makeVariant("23d28baa-685e-15c7-3cba-272e8e21a832", "57c8e992-389b-1fdb-8169-acb27bf045ef", "OLA-N3-50", 680, 340, 7, 3, [
        { optionId: "c9f48fc5-8c6e-65af-9370-eb51f28985bb", value: "50ml", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "85d9eb37-e48c-7689-ef0a-98b66883b226",
    tenant_id: TENANT_ID,
    category_id: "b8a8922e-fdf5-4d8e-3692-38698619b2ea",
    name: "Carolina Herrera Good Girl",
    slug: "carolina-herrera-good-girl",
    description: "Eau de parfum floral oriental con jazmin y cacao",
    brand: "Carolina Herrera",
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "b8a8922e-fdf5-4d8e-3692-38698619b2ea", name: "Fragancias" },
    product_images: [],
    product_variants: [
      makeVariant("389fd9c9-34ad-702b-4590-892f8dad425d", "85d9eb37-e48c-7689-ef0a-98b66883b226", "CH-GG-30", 1850, 920, 5, 2, [
        { optionId: "7be05673-0dd8-ff5a-c5cf-67076df57490", value: "30ml", colorHex: null, typeName: "Tamano" },
      ]),
      makeVariant("3be9acae-265d-821f-144f-d693028ee2c0", "85d9eb37-e48c-7689-ef0a-98b66883b226", "CH-GG-50", 2450, 1200, 4, 2, [
        { optionId: "c9f48fc5-8c6e-65af-9370-eb51f28985bb", value: "50ml", colorHex: null, typeName: "Tamano" },
      ]),
    ],
  },
  {
    id: "8cbf2cca-17de-342e-63f6-da343f12b0c3",
    tenant_id: TENANT_ID,
    category_id: "93d7621a-0470-7145-99e0-3039151f8afd",
    name: "NYX Lip Lingerie XXL",
    slug: "nyx-lip-lingerie-xxl",
    description: "Labial liquido mate de larga duracion",
    brand: "NYX",
    is_active: false,
    created_at: now,
    updated_at: now,
    created_by: USER_ID,
    deleted_at: null,
    categories: { id: "93d7621a-0470-7145-99e0-3039151f8afd", name: "Labiales" },
    product_images: [],
    product_variants: [
      makeVariant("f1f50917-c02b-097a-f3c5-081ddd3caee9", "8cbf2cca-17de-342e-63f6-da343f12b0c3", "NYX-LLX-BR", 220, 95, 0, 5, [
        { optionId: "187299d8-d76c-b947-3750-8a5f397b54d4", value: "Berry Rich", colorHex: "#8B2252", typeName: "Tono" },
      ]),
    ],
  },
]
