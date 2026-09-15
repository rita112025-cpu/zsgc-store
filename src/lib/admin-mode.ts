import { NextResponse } from "next/server";

// The admin key is public in this demo, so writes stay off unless explicitly enabled.
export function adminWritesEnabled(): boolean {
  return process.env.ADMIN_WRITES_ENABLED === "true";
}

export function adminReadOnlyResponse() {
  return NextResponse.json(
    { error: "Read-only demo: admin changes are disabled." },
    { status: 403 }
  );
}
