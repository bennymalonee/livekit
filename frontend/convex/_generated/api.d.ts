/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as analytics_internal from "../analytics_internal.js";
import type * as auth from "../auth.js";
import type * as coolify from "../coolify.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deployments from "../deployments.js";
import type * as deployments_internal from "../deployments_internal.js";
import type * as diagnostics from "../diagnostics.js";
import type * as http from "../http.js";
import type * as livekit from "../livekit.js";
import type * as modules from "../modules.js";
import type * as nodes from "../nodes.js";
import type * as sessions from "../sessions.js";
import type * as sessions_internal from "../sessions_internal.js";
import type * as settings from "../settings.js";
import type * as terminal from "../terminal.js";
import type * as vault from "../vault.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  analytics_internal: typeof analytics_internal;
  auth: typeof auth;
  coolify: typeof coolify;
  crons: typeof crons;
  dashboard: typeof dashboard;
  deployments: typeof deployments;
  deployments_internal: typeof deployments_internal;
  diagnostics: typeof diagnostics;
  http: typeof http;
  livekit: typeof livekit;
  modules: typeof modules;
  nodes: typeof nodes;
  sessions: typeof sessions;
  sessions_internal: typeof sessions_internal;
  settings: typeof settings;
  terminal: typeof terminal;
  vault: typeof vault;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
