-- =============================================================================
-- Load: Inventario Ideal
-- Tenant: 817036a8-d5d3-4301-986c-451b865fbca1
-- Brand:  Ideal
-- Source: InventarioIdeal-Plan.md (approved 2026-04-17)
-- =============================================================================
-- This script is IDEMPOTENT:
--   - products: ON CONFLICT (tenant_id, slug) DO NOTHING
--   - product_variants: ON CONFLICT (tenant_id, sku) DO NOTHING
--   - inventory_movements: ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
-- Safe to re-run. Will not overwrite existing stock if a sale has modified it.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1: Seed parent + independent products (71 total)
-- Parent products (5): have_variants=true
-- Independent products (66): have_variants=false
-- -----------------------------------------------------------------------------
WITH product_seed(name, slug, has_variants) AS (
  VALUES
    -- --- 5 Parent products (variants) ---
    ('Labial',                           'ideal-labial',                           true),
    ('Maquillaje en Crema',              'ideal-maquillaje-en-crema',              true),
    ('Maquillaje Doble Acción',          'ideal-maquillaje-doble-accion',          true),
    ('Maquillaje Fluido',                'ideal-maquillaje-fluido',                true),
    ('Rubor',                            'ideal-rubor',                            true),

    -- --- 66 Independent products (no variants) ---
    ('Crema Limpiadora',                 'ideal-n-0021',                           false),
    ('Tónico Balanceador',               'ideal-n-0022',                           false),
    ('Exfoliante Facial',                'ideal-n-0023',                           false),
    ('Crema Rocío Suprema',              'ideal-n-0024',                           false),
    ('Crema Limpiadora AR',              'ideal-a-0041',                           false),
    ('Tónico Reafirmante AR',            'ideal-a-0042',                           false),
    ('Crema de Día AR',                  'ideal-r-0043',                           false),
    ('Crema Nutritiva de Noche AR',      'ideal-r-0044',                           false),
    ('Crema para Cuerpo Prebióticos',    'ideal-n-0065',                           false),
    ('Aceite de Argán',                  'ideal-a-0068',                           false),
    ('Mascarilla de párpados',           'ideal-n-0071',                           false),
    ('Gel reparador párpados',           'ideal-n-0072',                           false),
    ('Gel desmaquillante',               'ideal-n-0073',                           false),
    ('Crema párpados',                   'ideal-n-0075',                           false),
    ('Ideal Skin Renewall',              'ideal-0076',                             false),
    ('Ideal Beautiful Neck',             'ideal-n-0077',                           false),
    ('IDEALISSIMA',                      'ideal-0079',                             false),
    ('Ideal Talco',                      'ideal-0093',                             false),
    ('Crema Extraordinaria Plus',        'ideal-b-0102',                           false),
    ('Crema Aloe Aid',                   'ideal-0103',                             false),
    ('Shampoo Prelift',                  'ideal-t-0111',                           false),
    ('Polvo de mascarilla',              'ideal-t-0112',                           false),
    ('Jugo de Mascarilla',               'ideal-t-0113',                           false),
    ('Vitamina E',                       'ideal-t-0114',                           false),
    ('Crema Nanosfera',                  'ideal-t-0115',                           false),
    ('Aloe Vera Shampoo',                'ideal-a-1264',                           false),
    ('Aloe Vera Acondicionador',         'ideal-a-1265',                           false),
    ('Aceite para Cuerpo',               'ideal-b-1302',                           false),
    ('Crema manos antibacterial',        'ideal-m-1310',                           false),
    ('Body Mist Antibacterial',          'ideal-1354',                             false),
    ('Bee IDEAL',                        'ideal-1358',                             false),
    ('Gel de Zábila con Árnica',         'ideal-a-1419',                           false),
    ('Ideal Protector Solar 50',         'ideal-p-1550',                           false),
    ('Crema Ideal Life Camote',          'ideal-n-1606',                           false),
    ('Crema Liposomas día y noche',      'ideal-a-1701',                           false),
    ('Mascarilla Antiedad',              'ideal-1708',                             false),
    ('Dermocell',                        'ideal-1725',                             false),
    ('Bebida de Zábila',                 'ideal-z-1975',                           false),
    ('Bebida de Colágeno con Q10',       'ideal-n-1977',                           false),
    ('Suplemento Ideal Protect',         'ideal-n-1980',                           false),
    ('Ideal Slim Cacao',                 'ideal-n-1982',                           false),
    ('Ideal Biotecs Pro y Pre Blend',    'ideal-n-1983',                           false),
    ('Ciao Minipore',                    'ideal-a-4001',                           false),
    ('Make Up Fixer',                    'ideal-c-2602',                           false),
    ('DD Face Perfector',                'ideal-a-2605',                           false),
    ('Polvo Suelto Translúcido',         'ideal-n-2803',                           false),
    ('Polvo Compacto',                   'ideal-n-2907',                           false),
    ('Sporlight Make Up',                'ideal-m-2062',                           false),
    ('Sporlight Powder',                 'ideal-p-2804',                           false),
    ('Corrector Cuarteto',               'ideal-c-3015',                           false),
    ('Corrector Líquido',                'ideal-c-3072',                           false),
    ('Rímel Roll On',                    'ideal-n-3101',                           false),
    ('Rímel DeLuxe',                     'ideal-m-3117',                           false),
    ('Lápiz Delineador de Ojos',         'ideal-d-3310',                           false),
    ('Delineador Líquido Ojos',          'ideal-d-3340',                           false),
    ('Lápiz Delineador de Cejas',        'ideal-d-3360',                           false),
    ('Delineador Cuarteto Ojos y Cejas', 'ideal-n-3902',                           false),
    ('Ideal Serum Regenerante',          'ideal-s-3902',                           false),
    ('IdealLift',                        'ideal-s-3903',                           false),
    ('Eye Lift Serum',                   'ideal-s-3905',                           false),
    ('Serum Triple Acción',              'ideal-s-3906',                           false),
    ('Mousse de Oxígeno',                'ideal-4002',                             false),
    ('Body Cream',                       'ideal-4011',                             false),
    ('Tónico Oxígeno',                   'ideal-4012',                             false),
    ('Foam',                             'ideal-4013',                             false),
    ('Booster',                          'ideal-4014',                             false)
)
INSERT INTO public.products (tenant_id, name, slug, brand, is_active, has_variants, is_bundle)
SELECT
  '817036a8-d5d3-4301-986c-451b865fbca1'::uuid,
  name,
  slug,
  'Ideal',
  true,
  has_variants,
  false
FROM product_seed
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 2: Seed product_variants (112 total = 46 parent variants + 66 defaults)
-- -----------------------------------------------------------------------------
WITH variant_seed(product_slug, sku, label, price, stock) AS (
  VALUES
    -- === Labial variants (31) — all $335 ===
    ('ideal-labial', 'D-2100', 'Rosa mexicano',   335::numeric, 41),
    ('ideal-labial', 'D-2101', 'Roule rose',      335::numeric,  0),
    ('ideal-labial', 'D-2102', 'Harmony',         335::numeric,  0),
    ('ideal-labial', 'D-2103', 'Chocolate',       335::numeric, 10),
    ('ideal-labial', 'D-2104', 'Cacao',           335::numeric,  0),
    ('ideal-labial', 'D-2105', 'Rose Coral',      335::numeric, 14),
    ('ideal-labial', 'D-2106', 'Majestic Red',    335::numeric,  0),
    ('ideal-labial', 'D-2110', 'Jubilee',         335::numeric, 12),
    ('ideal-labial', 'D-2111', 'Rouge',           335::numeric, 11),
    ('ideal-labial', 'D-2114', 'Antike Rose',     335::numeric,  2),
    ('ideal-labial', 'D-2117', 'Lluvia',          335::numeric,  1),
    ('ideal-labial', 'D-2118', 'Scarlet',         335::numeric,  0),
    ('ideal-labial', 'D-2119', 'Carioca Bronze',  335::numeric, 41),
    ('ideal-labial', 'D-2126', 'Orchid',          335::numeric,  0),
    ('ideal-labial', 'D-2128', 'Marilyn',         335::numeric, 10),
    ('ideal-labial', 'D-2133', 'Orange Sunset',   335::numeric,  4),
    ('ideal-labial', 'D-2134', 'Candid Red',      335::numeric,  3),
    ('ideal-labial', 'D-2136', 'Cosmo',           335::numeric,  0),
    ('ideal-labial', 'D-2137', 'Velbet',          335::numeric,  7),
    ('ideal-labial', 'D-2138', 'Dusty',           335::numeric,  8),
    ('ideal-labial', 'D-2139', 'Almond',          335::numeric,  0),
    ('ideal-labial', 'D-2141', 'Classic Red',     335::numeric,  0),
    ('ideal-labial', 'D-2180', 'Orange',          335::numeric,  0),
    ('ideal-labial', 'D-2191', 'Tangerine',       335::numeric,  0),
    ('ideal-labial', 'D-2195', 'Roxete',          335::numeric,  0),
    ('ideal-labial', 'E-2129', 'Shirley',         335::numeric,  9),
    ('ideal-labial', 'E-2140', 'Sin Nombre - 40', 335::numeric,  2),
    ('ideal-labial', 'E-2142', 'Sin Nombre - 42', 335::numeric,  7),
    ('ideal-labial', 'E-2163', 'Sin Nombre - 63', 335::numeric,  4),
    ('ideal-labial', 'E-2164', 'Sin Nombre - 64', 335::numeric,  4),
    ('ideal-labial', 'E-2165', 'Doreé',           335::numeric,  3),

    -- === Maquillaje en Crema (3) — all $609 ===
    ('ideal-maquillaje-en-crema', 'N-2311', '11 natural',    609::numeric, 55),
    ('ideal-maquillaje-en-crema', 'N-2312', '12 True beige', 609::numeric, 24),
    ('ideal-maquillaje-en-crema', 'N-2313', '13 Tan',        609::numeric, 14),

    -- === Maquillaje Doble Acción (2) — all $675 ===
    ('ideal-maquillaje-doble-accion', 'N-2415', 'Natural', 675::numeric, 50),
    ('ideal-maquillaje-doble-accion', 'N-2416', 'Soleado', 675::numeric, 31),

    -- === Maquillaje Fluido (6) — all $650 ===
    ('ideal-maquillaje-fluido', 'F-2551', 'Porcelana', 650::numeric, 12),
    ('ideal-maquillaje-fluido', 'F-2552', 'Sand',      650::numeric, 26),
    ('ideal-maquillaje-fluido', 'F-2553', 'Golden',    650::numeric, 10),
    ('ideal-maquillaje-fluido', 'F-2554', 'Almond',    650::numeric, 19),
    ('ideal-maquillaje-fluido', 'F-2555', 'Sienna',    650::numeric,  9),
    ('ideal-maquillaje-fluido', 'F-2556', 'Caramel',   650::numeric, 17),

    -- === Rubor (4) — all $675 ===
    ('ideal-rubor', 'R-3710', 'Brun Dore',    675::numeric, 2),
    ('ideal-rubor', 'R-3711', 'Rose',         675::numeric, 5),
    ('ideal-rubor', 'R-3712', 'Terra Rose',   675::numeric, 9),
    ('ideal-rubor', 'R-3729', 'Bronze Matin', 675::numeric, 0),

    -- === 66 Independent products (1 default variant each, label=NULL) ===
    ('ideal-n-0021', 'N-0021', NULL,  660::numeric,  36),
    ('ideal-n-0022', 'N-0022', NULL,  660::numeric,  46),
    ('ideal-n-0023', 'N-0023', NULL,  715::numeric,  41),
    ('ideal-n-0024', 'N-0024', NULL,  715::numeric,  53),
    ('ideal-a-0041', 'A-0041', NULL,  710::numeric,  11),
    ('ideal-a-0042', 'A-0042', NULL,  795::numeric,  83),
    ('ideal-r-0043', 'R-0043', NULL, 1215::numeric,   0),
    ('ideal-r-0044', 'R-0044', NULL, 1215::numeric,  41),
    ('ideal-n-0065', 'N-0065', NULL,  299::numeric,   7),
    ('ideal-a-0068', 'A-0068', NULL,  829::numeric,  18),
    ('ideal-n-0071', 'N-0071', NULL,  705::numeric,  23),
    ('ideal-n-0072', 'N-0072', NULL,  815::numeric,  67),
    ('ideal-n-0073', 'N-0073', NULL,  585::numeric,  84),
    ('ideal-n-0075', 'N-0075', NULL,  725::numeric, 102),
    ('ideal-0076',   '0076',   NULL,  965::numeric,  77),
    ('ideal-n-0077', 'N-0077', NULL, 1315::numeric,  30),
    ('ideal-0079',   '0079',   NULL, 3789::numeric,   2),
    ('ideal-0093',   '0093',   NULL,  290::numeric,  28),
    ('ideal-b-0102', 'B-0102', NULL, 1585::numeric,   0),
    ('ideal-0103',   '0103',   NULL,  915::numeric,  38),
    ('ideal-t-0111', 'T-0111', NULL,  619::numeric,  33),
    ('ideal-t-0112', 'T-0112', NULL, 1469::numeric,  66),
    ('ideal-t-0113', 'T-0113', NULL,  809::numeric,  32),
    ('ideal-t-0114', 'T-0114', NULL,  695::numeric,  79),
    ('ideal-t-0115', 'T-0115', NULL, 1155::numeric,  45),
    ('ideal-a-1264', 'A-1264', NULL,  429::numeric,  49),
    ('ideal-a-1265', 'A-1265', NULL,  459::numeric,   9),
    ('ideal-b-1302', 'B-1302', NULL,  465::numeric,   8),
    ('ideal-m-1310', 'M-1310', NULL,  295::numeric,   7),
    ('ideal-1354',   '1354',   NULL,  329::numeric,  28),
    ('ideal-1358',   '1358',   NULL,  240::numeric,   6),
    ('ideal-a-1419', 'A-1419', NULL,  329::numeric,   1),
    ('ideal-p-1550', 'P-1550', NULL,  695::numeric,  34),
    ('ideal-n-1606', 'N-1606', NULL, 1459::numeric,  98),
    ('ideal-a-1701', 'A-1701', NULL, 1825::numeric,  74),
    ('ideal-1708',   '1708',   NULL,  809::numeric,  36),
    ('ideal-1725',   '1725',   NULL,  945::numeric,  67),
    ('ideal-z-1975', 'Z-1975', NULL,  869::numeric,   0),
    ('ideal-n-1977', 'N-1977', NULL, 1269::numeric,   1),
    ('ideal-n-1980', 'N-1980', NULL, 1879::numeric,  14),
    ('ideal-n-1982', 'N-1982', NULL, 2205::numeric,   0),
    ('ideal-n-1983', 'N-1983', NULL, 1879::numeric,   1),
    ('ideal-a-4001', 'A-4001', NULL, 1105::numeric,  23),
    ('ideal-c-2602', 'C-2602', NULL,  495::numeric,  54),
    ('ideal-a-2605', 'A-2605', NULL,  525::numeric,  17),
    ('ideal-n-2803', 'N-2803', NULL,  465::numeric,   6),
    ('ideal-n-2907', 'N-2907', NULL,  569::numeric,  13),
    ('ideal-m-2062', 'M-2062', NULL, 1490::numeric,   0),
    ('ideal-p-2804', 'P-2804', NULL,  860::numeric,   0),
    ('ideal-c-3015', 'C-3015', NULL,  619::numeric,   8),
    ('ideal-c-3072', 'C-3072', NULL,  465::numeric,  15),
    ('ideal-n-3101', 'N-3101', NULL,  335::numeric, 178),
    ('ideal-m-3117', 'M-3117', NULL,  429::numeric,  48),
    ('ideal-d-3310', 'D-3310', NULL,  305::numeric,  23),
    ('ideal-d-3340', 'D-3340', NULL,  389::numeric, 106),
    ('ideal-d-3360', 'D-3360', NULL,  305::numeric,  49),
    ('ideal-n-3902', 'N-3902', NULL,  639::numeric,  45),
    ('ideal-s-3902', 'S-3902', NULL, 1815::numeric,   0),
    ('ideal-s-3903', 'S-3903', NULL, 1965::numeric,  10),
    ('ideal-s-3905', 'S-3905', NULL,  725::numeric,  11),
    ('ideal-s-3906', 'S-3906', NULL, 2729::numeric,  29),
    ('ideal-4002',   '4002',   NULL,  979::numeric,   3),
    ('ideal-4011',   '4011',   NULL,  565::numeric,  16),
    ('ideal-4012',   '4012',   NULL,  679::numeric,  10),
    ('ideal-4013',   '4013',   NULL,  425::numeric,   9),
    ('ideal-4014',   '4014',   NULL, 1029::numeric,   5)
)
INSERT INTO public.product_variants (
  tenant_id, product_id, sku, name, price, stock, initial_stock, is_active
)
SELECT
  '817036a8-d5d3-4301-986c-451b865fbca1'::uuid,
  p.id,
  vs.sku,
  vs.label,
  vs.price,
  vs.stock,
  0,      -- initial_stock = 0 (user wants stock visible only in físico)
  true
FROM variant_seed vs
JOIN public.products p
  ON p.slug = vs.product_slug
 AND p.tenant_id = '817036a8-d5d3-4301-986c-451b865fbca1'::uuid
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 3: Audit trail — inventory_movements for variants with stock > 0
-- One movement per variant: type='initial', inventory_source='physical'
-- idempotency_key: 'ideal-initial-load:<SKU>'
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory_movements (
  tenant_id, product_variant_id, type, inventory_source,
  quantity, stock_before, stock_after,
  reason, idempotency_key
)
SELECT
  pv.tenant_id,
  pv.id,
  'initial',
  'physical',
  pv.stock,
  0,
  pv.stock,
  'Carga inicial inventario Ideal',
  'ideal-initial-load:' || pv.sku
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE pv.tenant_id = '817036a8-d5d3-4301-986c-451b865fbca1'::uuid
  AND pv.stock > 0
  AND p.brand = 'Ideal'
  AND p.slug LIKE 'ideal-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.inventory_movements im
    WHERE im.tenant_id = pv.tenant_id
      AND im.idempotency_key = 'ideal-initial-load:' || pv.sku
  );

COMMIT;

-- =============================================================================
-- Verification queries (read-only, run separately to confirm results)
-- =============================================================================
-- SELECT brand, count(*) FROM products WHERE tenant_id = '817036a8-d5d3-4301-986c-451b865fbca1' AND deleted_at IS NULL GROUP BY brand;
-- SELECT count(*) AS total_variants FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE p.brand = 'Ideal' AND pv.tenant_id = '817036a8-d5d3-4301-986c-451b865fbca1';
-- SELECT sum(stock) AS total_units FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE p.brand = 'Ideal';
-- SELECT count(*) AS movements FROM inventory_movements WHERE tenant_id = '817036a8-d5d3-4301-986c-451b865fbca1' AND type = 'initial' AND inventory_source = 'physical' AND idempotency_key LIKE 'ideal-initial-load:%';
