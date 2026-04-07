"use client"

// Side-effect: register all boneyard skeleton bones with the runtime
// This must be imported from a client component to prevent tree-shaking
import "../bones/registry"

// Exported flag used in JSX to guarantee bundler includes this module
export const BONEYARD_INITIALIZED = true as const
