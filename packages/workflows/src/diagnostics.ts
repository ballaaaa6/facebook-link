export type WorkflowDiagnosticCode =
  | "workflow.invalid-transition"
  | "workflow.content-ready-requires-join"
  | "workflow.event-owner-mismatch"
  | "workflow.content-completion-invalid"
  | "workflow.content-completion-id-conflict"
  | "workflow.content-group-mismatch"
  | "workflow.content-scope-mismatch"
  | "workflow.content-attempt-conflict"
  | "workflow.content-stale-attempt"
  | "workflow.content-group-closed";

export class WorkflowInvariantError extends Error {
  readonly code: WorkflowDiagnosticCode;

  constructor(code: WorkflowDiagnosticCode, message: string) {
    super(message);
    this.name = "WorkflowInvariantError";
    this.code = code;
  }
}
