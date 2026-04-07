"use client"

/**
 * Dedicated capture page for boneyard CLI.
 *
 * Renders all skeleton fixtures that can't be reached via normal crawling
 * (dialogs, modals, detail pages, tabs). Each fixture is wrapped in a
 * BoneyardSkeleton so the CLI can capture it.
 *
 * Only used during development: `npm run bones`
 * Safe to leave in — the page is behind auth and has no navigation links.
 */

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { ProductTableFixture } from "@/features/productos/components/fixtures/product-table-fixture"
import { ProductEditFixture } from "@/features/productos/components/fixtures/product-edit-fixture"
import { TransitDetailFixture } from "@/features/inventario/components/fixtures/transit-detail-fixture"
import { SaleDetailFixture } from "@/features/ventas/components/fixtures/sale-detail-fixture"
import { MediaBrowserFixture } from "@/features/media/components/fixtures/media-browser-fixture"
import { StorageOverviewFixture } from "@/features/media/components/fixtures/storage-overview-fixture"
import { LoginFixture } from "@/features/auth/components/fixtures/login-fixture"

const skeletons = [
  { name: "products-table", fixture: <ProductTableFixture /> },
  { name: "product-edit-form", fixture: <ProductEditFixture /> },
  { name: "transit-week-detail", fixture: <TransitDetailFixture /> },
  { name: "sale-detail", fixture: <SaleDetailFixture /> },
  { name: "sale-detail-modal", fixture: <SaleDetailFixture /> },
  { name: "media-gallery", fixture: <MediaBrowserFixture /> },
  { name: "storage-overview", fixture: <StorageOverviewFixture /> },
  { name: "login-page", fixture: <LoginFixture /> },
]

export default function BoneyardCapturePage() {
  return (
    <div className="space-y-12 p-8">
      {skeletons.map(({ name, fixture }) => (
        <BoneyardSkeleton
          key={name}
          name={name}
          loading={false}
          fixture={fixture}
        >
          <div>{name}</div>
        </BoneyardSkeleton>
      ))}
    </div>
  )
}
