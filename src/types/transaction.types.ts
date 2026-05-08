export type Transaction = {
  id: string;
  date: string;
  rawDate: string;
  description: string;
  icon: string;
  amount: number;
  category: string;
  account_id: string;
  type: "income" | "expense" | "transfer";
  destination_account_id?: string | null;
  currency: string;
  exchange_rate: number;
}