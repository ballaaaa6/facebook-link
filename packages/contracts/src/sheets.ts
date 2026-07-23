import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";

export const sheetTabs = [
  "Today",
  "Products",
  "Links",
  "Content",
  "Publications",
  "Metrics Daily",
  "Run History",
  "Review Queue",
  "Dashboard",
  "_Mappings",
] as const;

export type SheetTab = (typeof sheetTabs)[number];

export interface SheetSyncTarget extends WorkspaceScoped {
  id: Identifier;
  spreadsheetId: string;
  enabled: boolean;
  timezone: "Asia/Bangkok";
  createdAt: IsoDateTime;
}

export interface SheetRow {
  tab: SheetTab;
  recordType: string;
  recordId: Identifier;
  recordVersion: number;
  values: Record<string, string | number | boolean | null>;
}

export interface SheetSyncResult {
  rowsAttempted: number;
  rowsWritten: number;
  rowsFailed: number;
  completedAt: IsoDateTime;
}

export interface SheetConnector {
  ensureStructure(target: SheetSyncTarget): Promise<void>;
  upsertRows(target: SheetSyncTarget, rows: readonly SheetRow[]): Promise<SheetSyncResult>;
}
