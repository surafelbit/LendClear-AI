export const SHAP_LABELS = {
  credit_score: "Credit Score",
  income: "Annual Income",
  loan_amount: "Loan Amount",
  years_employed: "Employment Duration",
  city: "City Index",
  points: "Relationship Points",
};

export const FORM_FIELDS = [
  { key: "city", label: "City Code", placeholder: "e.g. 102" },
  { key: "income", label: "Annual Income ($)", placeholder: "e.g. 68500" },
  { key: "credit_score", label: "Credit Score", placeholder: "e.g. 720" },
  { key: "loan_amount", label: "Loan Amount ($)", placeholder: "e.g. 450000" },
  { key: "years_employed", label: "Years Employed", placeholder: "e.g. 3" },
  { key: "points", label: "Relationship Points", placeholder: "e.g. 12" },
];

export const NAV_ITEMS = [
  { icon: "dashboard", label: "Portfolio Overview", active: true },
  {
    icon: "add_circle",
    label: "New Application",
    active: true,
    id: "application",
    divider: true,
  },
  {
    icon: "analytics",
    label: "Risk Analytics",
    id: "overview",
    active: true,
  },
  { icon: "verified_user", label: "Compliance Engine", active: true },
  {
    icon: "history",
    label: "Audit Logs",
    id: "audit",
    active: true,
    divider: true,
  },
  { icon: "settings", label: "System Settings", active: true },
];
