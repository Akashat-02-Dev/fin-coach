import OpenAI from "openai";
import { logger } from "./logger";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DebtItem {
  name: string;
  amount: number;
  interestRate: number;
  minPayment?: number | null;
}

export interface FinancialInput {
  monthlyIncome: number;
  dependants?: number;
  expenses: Record<string, number>;
  debts?: DebtItem[];
  notes?: string | null;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface SpendingRecommendation {
  category: string;
  recommendation: string;
  potentialSavings?: number | null;
}

export interface BudgetAnalysis {
  totalExpenses: number;
  monthlyIncome?: number | null;
  savingsRate?: number | null;
  spendingCategories: SpendingCategory[];
  recommendations: SpendingRecommendation[];
  summary: string;
}

export interface EmergencyFund {
  recommendedAmount: number;
  currentStatus: string;
  monthsOfExpenses: number;
}

export interface SavingsRecommendation {
  category: string;
  amount: number;
  rationale: string;
}

export interface SavingsStrategy {
  emergencyFund: EmergencyFund;
  recommendations: SavingsRecommendation[];
  automationTips: string[];
  summary: string;
}

export interface PayoffMethod {
  name: string;
  totalInterest: number;
  monthsToPayoff: number;
  monthlyPayment?: number | null;
  order: string[];
}

export interface DebtReduction {
  totalDebt: number;
  avalanche?: PayoffMethod;
  snowball?: PayoffMethod;
  recommendations: string[];
  summary: string;
}

export interface AnalysisResult {
  budgetAnalysis: BudgetAnalysis;
  savingsStrategy: SavingsStrategy;
  debtReduction: DebtReduction;
}

async function callAgent<T>(
  systemPrompt: string,
  userContent: string,
  agentName: string,
): Promise<T> {
  logger.info({ agentName }, "Running financial agent");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error(`${agentName} returned empty response`);

  try {
    return JSON.parse(content) as T;
  } catch {
    logger.error({ agentName, content }, "Failed to parse agent JSON");
    throw new Error(`${agentName} returned invalid JSON`);
  }
}

async function runBudgetAgent(input: FinancialInput): Promise<BudgetAnalysis> {
  const totalExpenses = Object.values(input.expenses).reduce((a, b) => a + b, 0);
  const savingsRate =
    input.monthlyIncome > 0
      ? ((input.monthlyIncome - totalExpenses) / input.monthlyIncome) * 100
      : null;

  const systemPrompt = `You are a Budget Analysis Agent — a certified financial planner specializing in spending pattern analysis.

Analyze the user's income and expenses. Return a JSON object with EXACTLY this shape:
{
  "totalExpenses": number,
  "monthlyIncome": number | null,
  "savingsRate": number | null,
  "spendingCategories": [{"category": string, "amount": number, "percentage": number}],
  "recommendations": [{"category": string, "recommendation": string, "potentialSavings": number | null}],
  "summary": string
}

Rules:
- spendingCategories must include ALL expense categories. Percentages must sum to ~100.
- Provide 3-5 specific, actionable recommendations with estimated monthly savings where possible.
- savingsRate is (income - expenses) / income * 100. Can be negative.
- summary: 2-3 sentence narrative of their financial health.
- Consider ${input.dependants ?? 0} dependant(s) when evaluating household expenses.
- Be honest but constructive — highlight both risks and opportunities.`;

  const userContent = JSON.stringify({
    monthlyIncome: input.monthlyIncome,
    dependants: input.dependants ?? 0,
    expenses: input.expenses,
    totalExpenses,
    savingsRate,
    notes: input.notes,
  });

  return callAgent<BudgetAnalysis>(systemPrompt, userContent, "BudgetAgent");
}

async function runSavingsAgent(
  input: FinancialInput,
  budgetAnalysis: BudgetAnalysis,
): Promise<SavingsStrategy> {
  const totalExpenses = budgetAnalysis.totalExpenses;

  const systemPrompt = `You are a Savings Strategy Agent — a financial planner specializing in building wealth through disciplined saving.

Given the user's financial data and budget analysis, create a savings strategy. Return a JSON object with EXACTLY this shape:
{
  "emergencyFund": {
    "recommendedAmount": number,
    "currentStatus": string,
    "monthsOfExpenses": number
  },
  "recommendations": [{"category": string, "amount": number, "rationale": string}],
  "automationTips": [string],
  "summary": string
}

Rules:
- Emergency fund: typically 3-6 months of expenses. More with dependants or job instability.
- emergencyFund.monthsOfExpenses: how many months of expenses the recommended fund covers (typically 3-6).
- emergencyFund.currentStatus: assessment string like "Insufficient — priority 1" or "On track".
- recommendations: specific savings categories (emergency fund, retirement, specific goals) with concrete monthly amounts. Be realistic about what's feasible given their cash flow.
- automationTips: 3-5 practical automation techniques (e.g., automatic transfers on payday).
- summary: 2-3 sentences with the key savings insight.
- Consider ${input.dependants ?? 0} dependant(s) in your risk assessment.`;

  const userContent = JSON.stringify({
    monthlyIncome: input.monthlyIncome,
    dependants: input.dependants ?? 0,
    totalExpenses,
    savingsRate: budgetAnalysis.savingsRate,
    budgetSummary: budgetAnalysis.summary,
    budgetRecommendations: budgetAnalysis.recommendations,
  });

  return callAgent<SavingsStrategy>(systemPrompt, userContent, "SavingsAgent");
}

async function runDebtAgent(
  input: FinancialInput,
  budgetAnalysis: BudgetAnalysis,
  savingsStrategy: SavingsStrategy,
): Promise<DebtReduction> {
  const debts = input.debts ?? [];
  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  const systemPrompt = `You are a Debt Reduction Agent — a financial planner specializing in debt elimination strategies.

Given the user's financial situation, create a debt payoff plan. Return a JSON object with EXACTLY this shape:
{
  "totalDebt": number,
  "avalanche": {
    "name": "Avalanche (Highest Interest First)",
    "totalInterest": number,
    "monthsToPayoff": number,
    "monthlyPayment": number | null,
    "order": [string]
  },
  "snowball": {
    "name": "Snowball (Smallest Balance First)",
    "totalInterest": number,
    "monthsToPayoff": number,
    "monthlyPayment": number | null,
    "order": [string]
  },
  "recommendations": [string],
  "summary": string
}

Rules:
- If there are NO debts, set totalDebt to 0, set avalanche and snowball to null (omit them), and provide recommendations about staying debt-free.
- avalanche: order debts highest interest rate first (mathematically optimal — saves most interest).
- snowball: order debts smallest balance first (psychologically motivating — quick wins).
- Calculate realistic total interest and payoff timeline based on minimum payments + any extra from the budget.
- order: array of debt names in payoff order.
- recommendations: 3-5 specific actionable strings (e.g. "Consolidate credit cards at X% to save $Y/month").
- summary: 2-3 sentence narrative.`;

  const userContent = JSON.stringify({
    debts,
    totalDebt,
    monthlyIncome: input.monthlyIncome,
    totalExpenses: budgetAnalysis.totalExpenses,
    savingsRate: budgetAnalysis.savingsRate,
    emergencyFundStatus: savingsStrategy.emergencyFund.currentStatus,
  });

  const result = await callAgent<DebtReduction>(systemPrompt, userContent, "DebtAgent");

  result.totalDebt = totalDebt;
  return result;
}

export async function runFinancialAnalysis(input: FinancialInput): Promise<AnalysisResult> {
  logger.info("Starting multi-agent financial analysis");

  const budgetAnalysis = await runBudgetAgent(input);
  logger.info("Budget agent complete");

  const savingsStrategy = await runSavingsAgent(input, budgetAnalysis);
  logger.info("Savings agent complete");

  const debtReduction = await runDebtAgent(input, budgetAnalysis, savingsStrategy);
  logger.info("Debt agent complete");

  return { budgetAnalysis, savingsStrategy, debtReduction };
}
