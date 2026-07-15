import type { ReactNode } from "react";

export interface CommandRecordRow {
  id: string;
  primary: string;
  secondary?: string;
  path: string;
}

export interface CommandTableColumn {
  key: string;
  label: string;
}

export interface CommandTableRow {
  id: string;
  path: string;
  [key: string]: ReactNode;
}

export type CommandResult =
  | { kind: "stat-answer"; summary: string; note?: string; actionPath?: string; actionLabel?: string }
  | {
      kind: "record-table";
      summary: string;
      note?: string;
      columns: CommandTableColumn[];
      rows: CommandTableRow[];
      viewAllPath: string;
      viewAllLabel: string;
    }
  | { kind: "record-list"; summary: string; records: CommandRecordRow[] }
  | { kind: "nav-suggestions"; records: CommandRecordRow[] }
  | { kind: "no-match"; suggestions: CommandRecordRow[] };

export interface IntentDefinition {
  id: string;
  matches: (queryLower: string) => boolean;
  execute: (query: string) => Promise<CommandResult>;
}
