export type AgentStatus = "working" | "waiting" | "review" | "offline";
export type ThemeName = "warm-studio" | "bright-operations" | "tech-operations";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  task: string;
  progress: number;
}
