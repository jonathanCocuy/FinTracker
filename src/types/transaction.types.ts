export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  account: string;
  type: "income" | "expense";
}