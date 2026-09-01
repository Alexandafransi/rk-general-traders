import { common } from "./common";
import { enums } from "./enums";
import { nav } from "./nav";
import { dashboardDict } from "./pages/dashboard";
import { jobsDict } from "./pages/jobs";
import { leadsDict } from "./pages/leads";
import { customersDict } from "./pages/customers";
import { salesDict } from "./pages/sales";
import { purchasesDict } from "./pages/purchases";
import { expensesDict } from "./pages/expenses";
import { payrollDict } from "./pages/payroll";
import { usersDict } from "./pages/users";
import { suppliersDict } from "./pages/suppliers";
import { financeDict } from "./pages/finance";
import { inventoryDict } from "./pages/inventory";
import { branchesDict } from "./pages/branches";
import { authDict } from "./pages/auth";
import { rolesDict } from "./pages/roles";
import { auditLogDict } from "./pages/auditLog";

export const dictionary = {
  en: {
    ...common.en,
    ...enums.en,
    ...nav.en,
    ...dashboardDict.en,
    ...jobsDict.en,
    ...leadsDict.en,
    ...customersDict.en,
    ...salesDict.en,
    ...purchasesDict.en,
    ...expensesDict.en,
    ...payrollDict.en,
    ...usersDict.en,
    ...suppliersDict.en,
    ...financeDict.en,
    ...inventoryDict.en,
    ...branchesDict.en,
    ...authDict.en,
    ...rolesDict.en,
    ...auditLogDict.en,
  } as Record<string, string>,
  sw: {
    ...common.sw,
    ...enums.sw,
    ...nav.sw,
    ...dashboardDict.sw,
    ...jobsDict.sw,
    ...leadsDict.sw,
    ...customersDict.sw,
    ...salesDict.sw,
    ...purchasesDict.sw,
    ...expensesDict.sw,
    ...payrollDict.sw,
    ...usersDict.sw,
    ...suppliersDict.sw,
    ...financeDict.sw,
    ...inventoryDict.sw,
    ...branchesDict.sw,
    ...authDict.sw,
    ...rolesDict.sw,
    ...auditLogDict.sw,
  } as Record<string, string>,
};
