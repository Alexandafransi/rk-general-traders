export const rolesDict = {
  en: {
    "roles.title": "Roles",
    "roles.subtitle": "Superadmin-only: define access levels and which pages each one can use. Superadmin and Admin are fixed and always have full access.",
    "roles.addRole": "Add Role",
    "roles.saveError": "Failed to save role",
    "roles.confirmDelete": 'Delete the "{{name}}" role? This cannot be undone.',
    "roles.deleteBlocked": "This role is still assigned to one or more accounts and can't be deleted.",

    "roles.col.name": "Role",
    "roles.col.key": "Key",
    "roles.col.modules": "Access",
    "roles.col.accounts": "Accounts",

    "roles.form.editTitle": "Edit {{name}}",
    "roles.field.name": "Role name",
    "roles.field.key": "Key",
    "roles.field.keyPlaceholder": "e.g. warehouse",
    "roles.field.modules": "Pages this role can access",

    "roles.module.categories": "Categories",
  },
  sw: {
    "roles.title": "Majukumu",
    "roles.subtitle": "Kwa msimamizi mkuu tu: bainisha viwango vya ufikiaji na kurasa ambazo kila kimoja kinaweza kutumia. Msimamizi Mkuu na Msimamizi ni thabiti na daima wana ufikiaji kamili.",
    "roles.addRole": "Ongeza Jukumu",
    "roles.saveError": "Imeshindwa kuhifadhi jukumu",
    "roles.confirmDelete": 'Futa jukumu "{{name}}"? Hatua hii haiwezi kutenduliwa.',
    "roles.deleteBlocked": "Jukumu hili bado limepangiwa akaunti moja au zaidi hivyo haliwezi kufutwa.",

    "roles.col.name": "Jukumu",
    "roles.col.key": "Ufunguo",
    "roles.col.modules": "Ufikiaji",
    "roles.col.accounts": "Akaunti",

    "roles.form.editTitle": "Hariri {{name}}",
    "roles.field.name": "Jina la jukumu",
    "roles.field.key": "Ufunguo",
    "roles.field.keyPlaceholder": "mfano: warehouse",
    "roles.field.modules": "Kurasa ambazo jukumu hili linaweza kufikia",

    "roles.module.categories": "Aina za Bidhaa",
  },
} as const;
