import type { SheetConnector, SheetRow, SheetSyncResult, SheetSyncTarget, SheetTab } from "@affiliate-ops/contracts";
import { sheetHeaders } from "./schema.ts";

export interface FakeWorkbookTab {
  headers: readonly string[];
  rows: Map<string, SheetRow>;
}

export class FakeSheetsConnector implements SheetConnector {
  readonly workbook = new Map<SheetTab, FakeWorkbookTab>();

  async ensureStructure(_target?: SheetSyncTarget): Promise<void> {
    for (const [tab, headers] of Object.entries(sheetHeaders) as [SheetTab, readonly string[]][]) {
      if (!this.workbook.has(tab)) this.workbook.set(tab, { headers, rows: new Map() });
    }
  }

  async upsertRows(target: SheetSyncTarget, rows: readonly SheetRow[]): Promise<SheetSyncResult> {
    await this.ensureStructure(target);
    let rowsWritten = 0;
    let rowsFailed = 0;
    for (const row of rows) {
      const tab = this.workbook.get(row.tab);
      if (!tab) {
        rowsFailed += 1;
        continue;
      }
      const prior = tab.rows.get(row.recordId);
      if (!prior || prior.recordVersion < row.recordVersion) {
        tab.rows.set(row.recordId, row);
        rowsWritten += 1;
      }
    }
    return { rowsAttempted: rows.length, rowsWritten, rowsFailed, completedAt: new Date().toISOString() };
  }
}
