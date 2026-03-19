-- ============================================================
-- POS Beauty — Seed Data
-- Ejecutar DESPUÉS de la migración (05-MIGRATION.sql)
-- Requiere: un usuario ya creado en Supabase Auth
-- ============================================================

-- INSTRUCCIONES:
-- 1. Primero crea un usuario en Supabase Auth (Dashboard > Authentication > Users > Add user)
--    Email: tu-email@ejemplo.com | Password: la que quieras
-- 2. Copia el UUID del usuario creado
-- 3. Reemplaza las dos variables de abajo con tus valores
-- 4. Ejecuta este script en Supabase SQL Editor

-- ============================================================
-- CONFIGURAR ESTOS VALORES ANTES DE EJECUTAR
-- ============================================================

DO $$
DECLARE
  v_tenant_id  uuid := gen_random_uuid();  -- Se genera automáticamente
  v_user_id    uuid := '00000000-0000-0000-0000-000000000000';  -- REEMPLAZAR con tu user ID de Supabase Auth

  -- IDs de tipos de variante (para referenciar después)
  vt_tono      uuid;
  vt_tamano    uuid;
  vt_linea     uuid;
  vt_formula   uuid;

  -- IDs de listas de precios
  pl_menudeo   uuid;
  pl_mayoreo   uuid;
  pl_reventa   uuid;

  -- IDs de categorías
  cat_maquillaje uuid;
  cat_labiales   uuid;
  cat_bases      uuid;
  cat_ojos       uuid;
  cat_skincare   uuid;
  cat_limpieza   uuid;
  cat_tratamiento uuid;
  cat_cabello    uuid;
  cat_fragancias uuid;
  cat_unas       uuid;
  cat_accesorios uuid;

BEGIN

  -- ============================================================
  -- TIPOS DE VARIANTE
  -- ============================================================

  INSERT INTO variant_types (id, tenant_id, name, sort_order, created_by)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Tono', 1, v_user_id)
  RETURNING id INTO vt_tono;

  INSERT INTO variant_types (id, tenant_id, name, sort_order, created_by)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Tamaño', 2, v_user_id)
  RETURNING id INTO vt_tamano;

  INSERT INTO variant_types (id, tenant_id, name, sort_order, created_by)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Línea', 3, v_user_id)
  RETURNING id INTO vt_linea;

  INSERT INTO variant_types (id, tenant_id, name, sort_order, created_by)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Fórmula', 4, v_user_id)
  RETURNING id INTO vt_formula;

  -- ============================================================
  -- OPCIONES DE VARIANTE — TONO (colores de ejemplo para labiales)
  -- ============================================================

  INSERT INTO variant_options (tenant_id, variant_type_id, value, color_hex, sort_order, created_by)
  VALUES
    (v_tenant_id, vt_tono, 'Red Lacquer',           '#C41E3A', 1, v_user_id),
    (v_tenant_id, vt_tono, 'Pink in the Afternoon',  '#E8A0BF', 2, v_user_id),
    (v_tenant_id, vt_tono, 'Rum Raisin',             '#6B3A4A', 3, v_user_id),
    (v_tenant_id, vt_tono, 'Nude Attitude',           '#C4956A', 4, v_user_id),
    (v_tenant_id, vt_tono, 'Berry Rich',              '#8B2252', 5, v_user_id),
    (v_tenant_id, vt_tono, 'Coral Crush',             '#F08080', 6, v_user_id),
    (v_tenant_id, vt_tono, 'Mauve It Over',           '#B08AA6', 7, v_user_id),
    (v_tenant_id, vt_tono, 'Natural',                 '#E8C4A0', 8, v_user_id),
    (v_tenant_id, vt_tono, 'Medium',                  '#D4A574', 9, v_user_id),
    (v_tenant_id, vt_tono, 'Deep',                    '#8B6F4E', 10, v_user_id);

  -- ============================================================
  -- OPCIONES DE VARIANTE — TAMAÑO
  -- ============================================================

  INSERT INTO variant_options (tenant_id, variant_type_id, value, sort_order, created_by)
  VALUES
    (v_tenant_id, vt_tamano, '15ml',   1, v_user_id),
    (v_tenant_id, vt_tamano, '30ml',   2, v_user_id),
    (v_tenant_id, vt_tamano, '50ml',   3, v_user_id),
    (v_tenant_id, vt_tamano, '100ml',  4, v_user_id),
    (v_tenant_id, vt_tamano, '150ml',  5, v_user_id),
    (v_tenant_id, vt_tamano, '200ml',  6, v_user_id),
    (v_tenant_id, vt_tamano, '3.7g',   7, v_user_id),
    (v_tenant_id, vt_tamano, '4.2g',   8, v_user_id),
    (v_tenant_id, vt_tamano, '7g',     9, v_user_id),
    (v_tenant_id, vt_tamano, '12g',    10, v_user_id);

  -- ============================================================
  -- OPCIONES DE VARIANTE — LÍNEA
  -- ============================================================

  INSERT INTO variant_options (tenant_id, variant_type_id, value, sort_order, created_by)
  VALUES
    (v_tenant_id, vt_linea, 'Profesional',  1, v_user_id),
    (v_tenant_id, vt_linea, 'Clásica',      2, v_user_id),
    (v_tenant_id, vt_linea, 'Premium',       3, v_user_id),
    (v_tenant_id, vt_linea, 'Edición Limitada', 4, v_user_id);

  -- ============================================================
  -- OPCIONES DE VARIANTE — FÓRMULA
  -- ============================================================

  INSERT INTO variant_options (tenant_id, variant_type_id, value, sort_order, created_by)
  VALUES
    (v_tenant_id, vt_formula, 'Mate',      1, v_user_id),
    (v_tenant_id, vt_formula, 'Glossy',    2, v_user_id),
    (v_tenant_id, vt_formula, 'Satinado',  3, v_user_id),
    (v_tenant_id, vt_formula, 'Cremoso',   4, v_user_id),
    (v_tenant_id, vt_formula, 'Oil-free',  5, v_user_id),
    (v_tenant_id, vt_formula, 'Hidratante', 6, v_user_id);

  -- ============================================================
  -- CATEGORÍAS (con subcategorías)
  -- ============================================================

  -- Nivel 1
  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Maquillaje', 'maquillaje', 1, v_user_id)
  RETURNING id INTO cat_maquillaje;

  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Skincare', 'skincare', 2, v_user_id)
  RETURNING id INTO cat_skincare;

  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Cabello', 'cabello', 3, v_user_id)
  RETURNING id INTO cat_cabello;

  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Fragancias', 'fragancias', 4, v_user_id)
  RETURNING id INTO cat_fragancias;

  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Uñas', 'unas', 5, v_user_id)
  RETURNING id INTO cat_unas;

  INSERT INTO categories (id, tenant_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Accesorios', 'accesorios', 6, v_user_id)
  RETURNING id INTO cat_accesorios;

  -- Nivel 2: Subcategorías de Maquillaje
  INSERT INTO categories (id, tenant_id, parent_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, cat_maquillaje, 'Labiales', 'labiales', 1, v_user_id)
  RETURNING id INTO cat_labiales;

  INSERT INTO categories (id, tenant_id, parent_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, cat_maquillaje, 'Bases y correctores', 'bases-correctores', 2, v_user_id)
  RETURNING id INTO cat_bases;

  INSERT INTO categories (id, tenant_id, parent_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, cat_maquillaje, 'Ojos', 'ojos', 3, v_user_id)
  RETURNING id INTO cat_ojos;

  -- Nivel 2: Subcategorías de Skincare
  INSERT INTO categories (id, tenant_id, parent_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, cat_skincare, 'Limpieza', 'limpieza', 1, v_user_id)
  RETURNING id INTO cat_limpieza;

  INSERT INTO categories (id, tenant_id, parent_id, name, slug, sort_order, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, cat_skincare, 'Tratamiento', 'tratamiento', 2, v_user_id)
  RETURNING id INTO cat_tratamiento;

  -- ============================================================
  -- LISTAS DE PRECIOS
  -- ============================================================

  INSERT INTO price_lists (id, tenant_id, name, description, discount_percent, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Menudeo', 'Precio regular sin descuento', 0, v_user_id)
  RETURNING id INTO pl_menudeo;

  INSERT INTO price_lists (id, tenant_id, name, description, discount_percent, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Mayoreo', 'Descuento del 15% para compras al mayoreo', 15, v_user_id)
  RETURNING id INTO pl_mayoreo;

  INSERT INTO price_lists (id, tenant_id, name, description, discount_percent, created_by)
  VALUES (gen_random_uuid(), v_tenant_id, 'Revendedoras', 'Descuento del 25% para revendedoras', 25, v_user_id)
  RETURNING id INTO pl_reventa;

  -- ============================================================
  -- LOG: Guardar tenant_id para referencia
  -- ============================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed completado exitosamente';
  RAISE NOTICE 'tenant_id: %', v_tenant_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Guarda este tenant_id en tu .env.local:';
  RAISE NOTICE 'NEXT_PUBLIC_TENANT_ID=%', v_tenant_id;
  RAISE NOTICE '========================================';

END;
$$;
