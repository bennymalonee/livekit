import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  //
  // Auth
  //
  ...authTables,

  //
  // Deployments & settings (existing)
  //
  deployments: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed"
      )
    ),
    livekitUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  //
  // Sessions & analytics
  //
  sessions: defineTable({
    roomName: v.string(),
    source: v.string(),
    region: v.string(),
    icon: v.string(),
    participantCount: v.number(),
    bitrateMbps: v.number(),
    qualityScore: v.number(), // 0–100
    status: v.string(), // e.g. "Optimal", "Congested"
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    ownerUserId: v.optional(v.id("users")),
  })
    .index("by_room", ["roomName"])
    .index("by_owner", ["ownerUserId"])
    .index("by_startedAt", ["startedAt"]),

  trafficMetrics: defineTable({
    metric: v.string(), // e.g. "egress_bps"
    region: v.string(), // e.g. "EU-West-1"
    windowStart: v.number(),
    windowEnd: v.number(),
    value: v.number(),
    unit: v.string(), // e.g. "bps", "gbps"
  }).index("by_metric_region", ["metric", "region", "windowStart"]),

  dailySnapshot: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalProjects: v.number(),
    concurrentUsers: v.number(),
    systemHealthPercent: v.number(),
    activeNodes: v.number(),
  }).index("by_date", ["date"]),

  //
  // Infrastructure nodes & diagnostics
  //
  nodes: defineTable({
    name: v.string(),
    region: v.string(),
    status: v.string(), // "online" | "offline" | "degraded"
    cpuLoad: v.number(),
    memoryLoad: v.number(),
    activeRooms: v.number(),
    lastHeartbeatAt: v.number(),
    createdAt: v.number(),
  }).index("by_region", ["region"]),

  diagnosticsEvents: defineTable({
    nodeId: v.optional(v.id("nodes")),
    level: v.string(), // "info" | "warning" | "error"
    code: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_node", ["nodeId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  //
  // Modules & feature flags
  //
  modules: defineTable({
    key: v.string(), // e.g. "recording", "hls_egress"
    label: v.string(),
    enabled: v.boolean(),
    config: v.optional(v.string()), // JSON string
  }).index("by_key", ["key"]),

  //
  // Vault - key and secret metadata
  //
  vaultKeys: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    // encryptedValue is stored server-side only; never returned raw to clients
    encryptedValue: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  }).index("by_name", ["name"]),

  //
  // Terminal command history
  //
  terminalCommands: defineTable({
    userId: v.id("users"),
    command: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
    exitCode: v.optional(v.number()),
    output: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
});

export default schema;
