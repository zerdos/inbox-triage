export interface InboxItem {
  id: string;
  source: string;
  subject: string;
  body: string;
  receivedAt: string;
}

export type Urgency = 1 | 2 | 3 | 4 | 5;

export interface TriageResult {
  id: string;
  category: string;
  urgency: Urgency;
  actionItems: string[];
  summary: string;
}

export interface DraftReply {
  itemId: string;
  draft: string;
}

export interface TriageBatch {
  items: InboxItem[];
  results: TriageResult[];
}
