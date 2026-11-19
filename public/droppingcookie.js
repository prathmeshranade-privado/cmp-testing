"use strict";

// This is deliberately a normal tracker-like script. If this line appears in
// DevTools, the browser executed the script before any later CMP reconciliation.
console.warn("[CMP TEST] Marketing script executed. readyState:", document.readyState);

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

window.marketingScriptRan = true;
window.marketingScriptRunId = runId;

// Client-side state which should not exist before Marketing consent.
document.cookie = "marketing_client_test=1; Path=/; SameSite=Lax";
document.cookie = "marketing_path_test=1; Path=/scoped; SameSite=Lax";
localStorage.setItem("marketing_storage_test", runId);

// This simulates tracker code that remains live after consent is withdrawn.
// CMP withdrawal can change future script handling, but it cannot cancel this
// already-created timer without a page reload or explicit tracker shutdown API.
let heartbeatCount = 0;
window.marketingTrackerTimerId = window.setInterval(() => {
  heartbeatCount += 1;
  const heartbeat = {
    runId,
    count: heartbeatCount,
    at: new Date().toISOString()
  };
  window.marketingTrackerHeartbeat = heartbeat;
  localStorage.setItem("marketing_tracker_heartbeat", JSON.stringify(heartbeat));
}, 1000);

// Locally, server.js implements these URLs. On Netlify, netlify.toml rewrites
// them to serverless functions with the same public URLs.
fetch(`/set-marketing-cookie?run=${encodeURIComponent(runId)}`, {
  credentials: "include",
  cache: "no-store"
}).catch((error) => console.error("[CMP TEST] server-cookie request failed", error));

fetch(`/set-scoped-cookie?run=${encodeURIComponent(runId)}`, {
  credentials: "include",
  cache: "no-store"
}).catch((error) => console.error("[CMP TEST] scoped-cookie request failed", error));

fetch(`/set-domain-cookie?run=${encodeURIComponent(runId)}`, {
  credentials: "include",
  cache: "no-store"
}).catch((error) => console.error("[CMP TEST] domain-cookie request failed", error));

fetch(`/set-http-only-cookie?run=${encodeURIComponent(runId)}`, {
  credentials: "include",
  cache: "no-store"
}).catch((error) => console.error("[CMP TEST] HttpOnly-cookie request failed", error));

// Extra tracker-like network calls. The local server and Netlify Function both
// receive these requests.
fetch(`/collect?kind=fetch&run=${encodeURIComponent(runId)}`, {
  cache: "no-store"
}).catch((error) => console.error("[CMP TEST] fetch request failed", error));

const pixel = new Image();
pixel.src = `/collect?kind=pixel&run=${encodeURIComponent(runId)}`;

const beaconQueued = navigator.sendBeacon(
  `/collect?kind=beacon&run=${encodeURIComponent(runId)}`,
  "cmp-timing-test"
);

console.info("[CMP TEST] Beacon queued:", beaconQueued);
