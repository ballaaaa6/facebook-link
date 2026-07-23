import type { SheetTab } from "@affiliate-ops/contracts";

export const sheetHeaders: Readonly<Record<SheetTab, readonly string[]>> = {
  Today: ["Date", "Workflow ID", "Product", "Stage", "Owner", "Status", "Next action", "Updated at"],
  Products: ["Product ID", "Title", "Shop", "Category", "Price", "Sales", "Rating", "Winner score", "Status", "Source URL", "Discovered at"],
  Links: ["Link ID", "Product ID", "Affiliate URL", "Channel", "Account", "Page", "Slot", "Campaign", "Creative", "Created at"],
  Content: ["Content ID", "Product ID", "Format", "Caption", "Image path", "Prompt version", "QA status", "Created at"],
  Publications: ["Publication ID", "Content ID", "Platform", "Account", "Destination", "Scheduled at", "Published at", "Post URL", "Status", "Error"],
  "Metrics Daily": ["Date", "Platform", "Account", "Destination", "Product ID", "Clicks", "Orders", "Revenue", "Commission", "Reach", "Engagement", "Spend"],
  "Run History": ["Run ID", "Workflow ID", "Stage", "Agent", "Started at", "Finished at", "Status", "Attempt", "Trace ID", "Error"],
  "Review Queue": ["Review ID", "Type", "Record ID", "Risk", "Requested by", "Summary", "Created at", "Expires at", "Status", "Decision note"],
  Dashboard: ["Metric", "Today", "Yesterday", "7 day average", "Target", "Updated at"],
  _Mappings: ["Mapping type", "Internal ID", "Display name", "External ID", "Platform", "Active", "Updated at"],
};

export function valuesForHeaders(tab: SheetTab, values: Record<string, string | number | boolean | null>) {
  return sheetHeaders[tab].map((header) => values[header] ?? null);
}
