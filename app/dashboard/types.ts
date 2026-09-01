export type Branch = {
  id: number;
  name: string;
  location: string;
  phone: string;
  active: boolean;
  created_at: string;
};

export type AuditLogEntry = {
  id: number;
  actor_username: string;
  action: "create" | "update" | "deleted" | "login" | "login_failed" | "logout";
  action_display: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  branch: number | null;
  branch_name: string | null;
  created_at: string;
};

export type AuditLogPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
};

// A role "key": either a fixed built-in role ("superadmin"/"admin") or the
// `key` of a dynamic Role row (e.g. "manager", "sales", or a custom one a
// superadmin created). Not a literal union since dynamic roles are open-ended.
export type RoleKey = string;

export const FIXED_ROLES = ["superadmin", "admin"] as const;

export type RoleDef = {
  id: number;
  key: string;
  name: string;
  modules: string[];
  users_count: number;
  created_at: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: RoleKey;
  role_display: string;
  branch: Branch | null;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
};

export type Technician = {
  id: number;
  name: string;
  role: string;
  access_role: string;
  access_role_display: string;
  account_username: string | null;
  email: string;
  phone: string;
  tint: number;
  active: boolean;
  monthly_salary: string;
  date_joined: string;
  initials: string;
};

export type Job = {
  id: number;
  branch: Branch | null;
  job_number: string;
  title: string;
  customer_name: string;
  location: string;
  category: string;
  category_display: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  assigned_to: Technician | null;
  start_date: string | null;
  created_at: string;
};

export type Todo = {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  assigned_to: Technician | null;
  done: boolean;
  created_at: string;
};

export type JobStatusBreakdown = {
  status: string;
  label: string;
  count: number;
};

export type DashboardSummary = {
  access: { leads: boolean; jobs: boolean };
  kpis: {
    converted_leads: number;
    converted_leads_pct: number;
    active_jobs: number;
    total_jobs: number;
    unfinished_jobs: number;
    unfinished_jobs_pct: number;
  };
  lead_conversion: {
    converted: number;
    lost: number;
    open: number;
    conversion_rate: number;
  } | null;
  job_status_breakdown: JobStatusBreakdown[];
  recent_jobs: Job[];
  todos: Todo[];
};

export type TrendPoint = {
  month: string;
  sales: string;
  purchases: string;
  expenses: string;
  payroll: string;
  profit: string;
};

export type DashboardTrends = {
  months: number;
  series: TrendPoint[];
  access: boolean;
};

export type TechnicianTrend = {
  technician_id: number;
  name: string;
  tint: number;
  jobs_completed: number;
};

export type Lead = {
  id: number;
  branch: Branch | null;
  name: string;
  phone: string;
  email: string;
  location: string;
  interest: string;
  interest_display: string;
  source: string;
  source_display: string;
  status: string;
  status_display: string;
  notes: string;
  created_at: string;
};

export type LeadSourceBreakdown = { source: string; label: string; count: number; converted: number };

export type LeadsSummary = {
  kpis: {
    total_leads: number;
    new_this_month: number;
    open_leads: number;
    conversion_rate: number;
  };
  status_breakdown: JobStatusBreakdown[];
  source_breakdown: LeadSourceBreakdown[];
  leads: Lead[];
};

export type JobsSummary = {
  kpis: {
    total_jobs: number;
    active_jobs: number;
    done_this_month: number;
    unassigned_jobs: number;
  };
  status_breakdown: JobStatusBreakdown[];
  by_technician: TechnicianTrend[];
  jobs: Job[];
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  source: string;
  source_display: string;
  created_at: string;
};

export type CustomerRow = Customer & {
  sales_count: number;
  total_paid: string;
  jobs_count: number;
};

export type CustomersSummary = {
  kpis: {
    total_customers: number;
    new_this_month: number;
    manual_count: number;
    auto_count: number;
  };
  customers: CustomerRow[];
};

export type RoleBreakdown = { role: string; label: string; count: number };

export type UsersSummary = {
  kpis: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    with_login: number;
  };
  role_breakdown: RoleBreakdown[];
  users: Technician[];
};

export type Payslip = {
  id: number;
  technician: Technician;
  period: string;
  base_salary: string;
  allowances: string;
  deductions: string;
  net_pay: string;
  status: string;
  status_display: string;
  paid_date: string | null;
  created_at: string;
};

export type PayrollSummary = {
  kpis: {
    total_this_month: string;
    paid_this_month: number;
    pending_this_month: number;
    staff_on_payroll: number;
    all_time_paid: string;
  };
  latest_period: string | null;
  payslips: Payslip[];
};

export type Supplier = {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  notes: string;
  purchase_count: number;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  products_count: number;
  purchases_count: number;
  created_at: string;
};

export type Product = {
  id: number;
  branch: Branch | null;
  name: string;
  category: Category | null;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  notes: string;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  created_at: string;
};

export type StockMovement = {
  id: number;
  product: Product;
  change: number;
  reason: string;
  reason_display: string;
  reference: string;
  note: string;
  created_at: string;
};

export type InventorySummary = {
  kpis: {
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_units_on_hand: number;
  };
  products: Product[];
  recent_movements: StockMovement[];
};

export type Purchase = {
  id: number;
  branch: Branch | null;
  po_number: string;
  supplier: Supplier | null;
  product: Product | null;
  item_name: string;
  category: Category | null;
  quantity: number;
  unit_cost: string;
  total_cost: number;
  status: string;
  status_display: string;
  purchase_date: string;
  created_at: string;
};

export type PurchasesSummary = {
  kpis: {
    total_spend_this_month: string;
    pending_orders: number;
    received_this_month: number;
    total_purchases: number;
  };
  purchases: Purchase[];
};

export type Expense = {
  id: number;
  branch: Branch | null;
  category: string;
  category_display: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  payment_method_display: string;
  recorded_by: Technician | null;
  created_at: string;
};

export type ExpenseCategoryBreakdown = { category: string; label: string; total: string };

export type ExpensesSummary = {
  kpis: {
    total_this_month: string;
    count_this_month: number;
    total_expenses: number;
  };
  category_breakdown: ExpenseCategoryBreakdown[];
  expenses: Expense[];
};

export type Sale = {
  id: number;
  branch: Branch | null;
  invoice_number: string;
  customer_name: string;
  job: Job | null;
  product: Product | null;
  category: string;
  category_display: string;
  description: string;
  quantity: number;
  unit_price: string;
  amount: number;
  amount_paid: string;
  balance_due: number;
  payment_status: string;
  payment_status_display: string;
  payment_method: string;
  payment_method_display: string;
  sale_date: string;
  created_at: string;
};

export type SaleCategoryBreakdown = { category: string; label: string; total: string };

export type SalesSummary = {
  kpis: {
    revenue_this_month: string;
    collected_this_month: string;
    outstanding_balance: string;
    count_this_month: number;
  };
  category_breakdown: SaleCategoryBreakdown[];
  sales: Sale[];
};

export type FinanceBreakdown = { label: string; value: string };

export type FinanceSummary = {
  month: string;
  kpis: {
    revenue_total: string;
    total_costs: string;
    net_profit: string;
    payroll_total: string;
    purchases_total: string;
    expenses_total: string;
  };
  breakdown: FinanceBreakdown[];
  recent_purchases: Purchase[];
  recent_expenses: Expense[];
  recent_sales: Sale[];
};
