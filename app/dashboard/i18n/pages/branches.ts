export const branchesDict = {
  en: {
    "branches.loadError": "Failed to load branches",
    "branches.saveError": "Failed to save branch",
    "branches.loading": "Loading branches…",
    "branches.confirmDelete": 'Delete branch "{{name}}"? This cannot be undone.',
    "branches.deleteBlocked": "This branch still has records attached to it and can't be deleted. Try marking it inactive instead.",
    "branches.addBranch": "Add Branch",

    "branches.title": "Branches",
    "branches.subtitle": "The shops RK General Traders operates — each records its own sales, purchases, expenses, jobs, leads and stock",

    "branches.col.name": "Branch",
    "branches.col.location": "Location",
    "branches.col.phone": "Phone",
    "branches.col.status": "Status",

    "branches.status.active": "Active",
    "branches.status.inactive": "Inactive",

    "branches.form.editTitle": "Edit {{name}}",
    "branches.field.name": "Branch name",
    "branches.field.location": "Location",
    "branches.field.locationPlaceholder": "e.g. Kariakoo, Dar es Salaam",
    "branches.field.phone": "Phone",
    "branches.field.active": "Active",
  },
  sw: {
    "branches.loadError": "Imeshindwa kupakia matawi",
    "branches.saveError": "Imeshindwa kuhifadhi tawi",
    "branches.loading": "Inapakia matawi…",
    "branches.confirmDelete": 'Futa tawi "{{name}}"? Hatua hii haiwezi kutenduliwa.',
    "branches.deleteBlocked": "Tawi hili bado lina taarifa zilizounganishwa nalo hivyo haliwezi kufutwa. Jaribu kulifanya lisiwe hai badala yake.",
    "branches.addBranch": "Ongeza Tawi",

    "branches.title": "Matawi",
    "branches.subtitle": "Maduka ambayo RK General Traders inaendesha — kila moja linarekodi mauzo, manunuzi, matumizi, kazi, wateja watarajiwa na bidhaa zake",

    "branches.col.name": "Tawi",
    "branches.col.location": "Mahali",
    "branches.col.phone": "Simu",
    "branches.col.status": "Hali",

    "branches.status.active": "Hai",
    "branches.status.inactive": "Halifanyi Kazi",

    "branches.form.editTitle": "Hariri {{name}}",
    "branches.field.name": "Jina la tawi",
    "branches.field.location": "Mahali",
    "branches.field.locationPlaceholder": "mfano: Kariakoo, Dar es Salaam",
    "branches.field.phone": "Simu",
    "branches.field.active": "Hai",
  },
} as const;
