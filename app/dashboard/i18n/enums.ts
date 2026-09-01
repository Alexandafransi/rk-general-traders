// Shared translations for backend choice-field codes, keyed by the raw code
// (e.g. "in_progress", "cash") so any page can render `t(`enums.jobStatus.${job.status}`)`
// instead of the English `_display` string the API returns.
export const enums = {
  en: {
    "enums.jobStatus.not_started": "To do",
    "enums.jobStatus.in_progress": "In progress",
    "enums.jobStatus.review": "Review",
    "enums.jobStatus.on_hold": "On hold",
    "enums.jobStatus.cancelled": "Cancelled",
    "enums.jobStatus.done": "Done",

    "enums.priority.low": "Low",
    "enums.priority.medium": "Medium",
    "enums.priority.high": "High",

    "enums.leadStatus.new": "New",
    "enums.leadStatus.contacted": "Contacted",
    "enums.leadStatus.quoted": "Quoted",
    "enums.leadStatus.converted": "Converted",
    "enums.leadStatus.lost": "Lost",

    "enums.leadSource.website": "Website",
    "enums.leadSource.whatsapp": "WhatsApp",
    "enums.leadSource.phone": "Phone Call",
    "enums.leadSource.referral": "Referral",
    "enums.leadSource.walk_in": "Walk-in",

    "enums.serviceCategory.fiber_installation": "Fiber Installation",
    "enums.serviceCategory.router_setup": "Router Setup",
    "enums.serviceCategory.wifi_extender": "Wi-Fi Extender",
    "enums.serviceCategory.mikrotik_voucher": "Mikrotik Voucher",
    "enums.serviceCategory.access_point": "Access Point",
    "enums.serviceCategory.fiber_onu_ont": "Fiber ONU/ONT",
    "enums.serviceCategory.power_backup": "Power Backup",
    "enums.serviceCategory.support": "Support",
    "enums.serviceCategory.product_sale": "Product Sale",
    "enums.serviceCategory.other": "Other",

    "enums.paymentStatus.unpaid": "Unpaid",
    "enums.paymentStatus.partial": "Partially Paid",
    "enums.paymentStatus.paid": "Paid",

    "enums.paymentMethod.cash": "Cash",
    "enums.paymentMethod.mobile_money": "Mobile Money",
    "enums.paymentMethod.bank_transfer": "Bank Transfer",
    "enums.paymentMethod.card": "Card",

    "enums.purchaseStatus.ordered": "Ordered",
    "enums.purchaseStatus.received": "Received",
    "enums.purchaseStatus.cancelled": "Cancelled",

    "enums.expenseCategory.fuel_transport": "Fuel & Transport",
    "enums.expenseCategory.rent": "Rent",
    "enums.expenseCategory.utilities": "Utilities",
    "enums.expenseCategory.marketing": "Marketing",
    "enums.expenseCategory.maintenance": "Equipment Maintenance",
    "enums.expenseCategory.office_supplies": "Office Supplies",
    "enums.expenseCategory.other": "Other",

    "enums.accessRole.admin": "Admin",
    "enums.accessRole.manager": "Manager",
    "enums.accessRole.staff": "Staff",

    "enums.payslipStatus.draft": "Draft",
    "enums.payslipStatus.paid": "Paid",

    "enums.customerSource.manual": "Added Manually",
    "enums.customerSource.sale": "From a Sale",
    "enums.customerSource.job": "From an Installation Job",

    "enums.stockReason.purchase": "Stock Received",
    "enums.stockReason.sale": "Stock Sold",
    "enums.stockReason.adjustment": "Manual Adjustment",
  },
  sw: {
    "enums.jobStatus.not_started": "Bado",
    "enums.jobStatus.in_progress": "Inaendelea",
    "enums.jobStatus.review": "Ukaguzi",
    "enums.jobStatus.on_hold": "Imesitishwa",
    "enums.jobStatus.cancelled": "Imeghairiwa",
    "enums.jobStatus.done": "Imekamilika",

    "enums.priority.low": "Chini",
    "enums.priority.medium": "Wastani",
    "enums.priority.high": "Juu",

    "enums.leadStatus.new": "Mpya",
    "enums.leadStatus.contacted": "Amewasiliana",
    "enums.leadStatus.quoted": "Amepewa Bei",
    "enums.leadStatus.converted": "Amekuwa Mteja",
    "enums.leadStatus.lost": "Amepotea",

    "enums.leadSource.website": "Tovuti",
    "enums.leadSource.whatsapp": "WhatsApp",
    "enums.leadSource.phone": "Simu",
    "enums.leadSource.referral": "Rufaa",
    "enums.leadSource.walk_in": "Alifika Ofisini",

    "enums.serviceCategory.fiber_installation": "Usimikaji wa Fiber",
    "enums.serviceCategory.router_setup": "Usimikaji wa Router",
    "enums.serviceCategory.wifi_extender": "Kiongeza Mtandao wa WiFi",
    "enums.serviceCategory.mikrotik_voucher": "Voucha ya Mikrotik",
    "enums.serviceCategory.access_point": "Kipokezi cha Mtandao",
    "enums.serviceCategory.fiber_onu_ont": "Fiber ONU/ONT",
    "enums.serviceCategory.power_backup": "Akiba ya Umeme",
    "enums.serviceCategory.support": "Msaada wa Kiufundi",
    "enums.serviceCategory.product_sale": "Uuzaji wa Bidhaa",
    "enums.serviceCategory.other": "Nyingine",

    "enums.paymentStatus.unpaid": "Haijalipwa",
    "enums.paymentStatus.partial": "Imelipwa Kiasi",
    "enums.paymentStatus.paid": "Imelipwa",

    "enums.paymentMethod.cash": "Fedha Taslimu",
    "enums.paymentMethod.mobile_money": "Pesa za Simu",
    "enums.paymentMethod.bank_transfer": "Uhamisho wa Benki",
    "enums.paymentMethod.card": "Kadi",

    "enums.purchaseStatus.ordered": "Imeagizwa",
    "enums.purchaseStatus.received": "Imepokelewa",
    "enums.purchaseStatus.cancelled": "Imeghairiwa",

    "enums.expenseCategory.fuel_transport": "Mafuta na Usafiri",
    "enums.expenseCategory.rent": "Kodi",
    "enums.expenseCategory.utilities": "Huduma (Umeme/Maji)",
    "enums.expenseCategory.marketing": "Uuzaji na Matangazo",
    "enums.expenseCategory.maintenance": "Matengenezo ya Vifaa",
    "enums.expenseCategory.office_supplies": "Vifaa vya Ofisi",
    "enums.expenseCategory.other": "Nyingine",

    "enums.accessRole.admin": "Msimamizi Mkuu",
    "enums.accessRole.manager": "Meneja",
    "enums.accessRole.staff": "Mfanyakazi",

    "enums.payslipStatus.draft": "Rasimu",
    "enums.payslipStatus.paid": "Imelipwa",

    "enums.customerSource.manual": "Imeongezwa kwa Mkono",
    "enums.customerSource.sale": "Kutoka kwa Uuzaji",
    "enums.customerSource.job": "Kutoka kwa Kazi ya Usimikaji",

    "enums.stockReason.purchase": "Bidhaa Zimepokelewa",
    "enums.stockReason.sale": "Bidhaa Zimeuzwa",
    "enums.stockReason.adjustment": "Marekebisho ya Mkono",
  },
} as const;
