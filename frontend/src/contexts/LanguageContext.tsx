import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'rw' | 'en' | 'fr';

export interface Translations {
  common: {
    online: string;
    offline: string;
    close: string;
    cancel: string;
    save: string;
    delete: string;
    search: string;
    loading: string;
    rwf: string;
    actions: string;
  };
  ownerDashboard: {
    hubBadge: string;
    hubTitle: string;
    greeting: (name: string) => string;
    greetingSub: string;
    card1: {
      tag: string;
      title: string;
      subtitle: string;
      desc: string;
      action: string;
    };
    card2: {
      tag: string;
      title: string;
      subtitle: string;
      desc: string;
      action: string;
    };
    card3: {
      tag: string;
      title: string;
      subtitle: string;
      desc: string;
      action: string;
    };
    card4: {
      tag: string;
      title: string;
      subtitle: string;
      desc: string;
      action: string;
    };
    card5: {
      tag: string;
      title: string;
      subtitle: string;
      desc: string;
      action: string;
    };
  };
  card1Modal: {
    title: string;
    subtitle: string;
    tabNew: string;
    tabRestock: string;
    productName: string;
    category: string;
    costPrice: string;
    sellingPrice: string;
    floorPrice: string;
    initialStock: string;
    unit: string;
    reorderLevel: string;
    expiryDate: string;
    vatApplicable: string;
    saveProductBtn: string;
    selectProduct: string;
    additionalQty: string;
    supplierSource: string;
    restockReason: string;
    restockBtn: string;
  };
  card2Modal: {
    title: string;
    subtitle: string;
    tabShifts: string;
    tabStaff: string;
    tabContracts: string;
    newStaffBtn: string;
    activeStaffTitle: string;
    contractTitle: string;
    contractDesc: string;
    generatePdf: string;
  };
  card3Modal: {
    title: string;
    subtitle: string;
    tabProfits: string;
    tabAudit: string;
    periodToday: string;
    period7d: string;
    periodMonth: string;
    periodAll: string;
    grossSales: string;
    wholesaleCost: string;
    grossProfit: string;
    profitMargin: string;
  };
  card4Modal: {
    title: string;
    subtitle: string;
    tabInvoices: string;
    tabExpenses: string;
    recordInvoiceBtn: string;
    recordExpenseBtn: string;
    expenseJustification: string;
    supplierName: string;
  };
  card5Modal: {
    title: string;
    subtitle: string;
    disclaimer: string;
    inputPlaceholder: string;
    sendBtn: string;
    promptChips: { label: string; query: string }[];
  };
}

export const TRANSLATIONS_DICTIONARY: Record<Language, Translations> = {
  rw: {
    common: {
      online: 'KURI INTERNET',
      offline: 'NTA INTERNET',
      close: 'Funga',
      cancel: 'Kureka',
      save: 'Bika',
      delete: 'Siba',
      search: 'Shakisha...',
      loading: 'Biratunganywa...',
      rwf: 'RWF',
      actions: 'Ibikorwa'
    },
    ownerDashboard: {
      hubBadge: 'KIGALI BUSINESS HUB • SISTEMI YEMEWE NA RRA',
      hubTitle: "Ubuyobozi Bukuru bw'Ubucuruzi",
      greeting: (name: string) => `Muraho Neza, ${name || 'Nyirubucuruzi'} 👋`,
      greetingSub: "Hitamo icyo ushaka gukora uyu munsi: kwandika stock, gukurikirana abakozi, kureba inyungu n'amafaranga asohoka, cyangwa kubaza AI Assistant.",
      card1: {
        tag: 'Card 1 • Stock',
        title: 'Kwandika Stock Nshya & Ibicuruzwa',
        subtitle: "Kwandika ibicuruzwa bishya no kwongera umubare w'ibiri muri stock.",
        desc: "Injiza ibicuruzwa bishya muri sisitemu, igiciro cyo kurangura n'icyo kugurisha, cyangwa wongere umubare w'ibicuruzwa byaje (Restock).",
        action: 'Fungura Ifishi ya Stock'
      },
      card2: {
        tag: 'Card 2 • Staff',
        title: 'Gucunga Abakozi & Amashifuti',
        subtitle: "Gukurikirana amasaha n'amashifuti y'abakozi, kwandika/gukura umukozi, no kubika ama Contract (PDF).",
        desc: "Clock-in n'amasaha y'abakozi, kwandika umukozi mushya n'amabanga ya POS (PIN & Password), no kubika amasezerano ya PDF.",
        action: "Fungura Amakuru y'Abakozi"
      },
      card3: {
        tag: 'Card 3 • Analytics',
        title: "Gucunga Ubucuruzi & Imibare y'Inyungu",
        subtitle: "Kumenya inyungu (ya uyu munsi n'amatariki uhisemo), kureba audit y'umukozi (Cash/MoMo balance check).",
        desc: "Reba profit kuri buri gicuruzwa n'igihe wahisemo, unakore reconciliation yo kugenzura amafaranga ya cash na MoMo yasizwe na cashier.",
        action: 'Fungura Revenue & Audits'
      },
      card4: {
        tag: 'Card 4 • Invoices',
        title: 'Kurangura, Facture & Amafaranga Yasohotse',
        subtitle: "Kubika Facture/Invoices z'ibyo waranguye no kwandika amakuru y'amafaranga asohoka (expenses & payroll).",
        desc: "Kubika ama facture yo kurangura no kwandika amafaranga asohoka (umuriro, ubukode, transport) hamwe n'ibisobanuro bya ngombwa.",
        action: 'Fungura Facture & Expenses'
      },
      card5: {
        tag: 'Card 5 • AI Assistant',
        title: 'Smart AI Assistant (AI Business Companion)',
        subtitle: "Baza AI ibyerekeye business yawe (Stock igiye gushira, abakozi bazohembwa, amakuru y'igurisha).",
        desc: "Umuhanga wa AI usesengura amakuru ya stock yawe mu gihe nyacyo, akakubwira ibiri gushira, amafaranga asohoka n'ubucuruzi bwa Kigali mu Kinyarwanda cyangwa mu Cyongereza.",
        action: 'Baza AI Assistant (Ask Store AI)'
      }
    },
    card1Modal: {
      title: 'Kwandika Stock Nshya & Kongera Umubare',
      subtitle: "Gushyiramo ibicuruzwa bishya no kwongera stock y'ibisanzwe muri depoti",
      tabNew: 'Kwandika Igicuruzwa Gishya',
      tabRestock: 'Kongera Stock ku Bisanzwe',
      productName: "Izina ry'Igicuruzwa",
      category: 'Icyiciro (Category)',
      costPrice: 'Igiciro cyo Kurangura (Cost RWF)',
      sellingPrice: 'Igiciro cyo Kugurisha (Selling RWF)',
      floorPrice: 'Igiciro cya Hasi Gishoboka (Floor RWF)',
      initialStock: 'Umubare wose uje (Initial Stock)',
      unit: 'Ikipimo (Unit)',
      reorderLevel: 'Urugero rwo Kurangura (Reorder Alert)',
      expiryDate: 'Itariki yo Kurangira (Expiry Date)',
      vatApplicable: 'Gikorerwa TVA (18% RRA EBM)',
      saveProductBtn: 'Bika Igicuruzwa Gishya muri Sisitemu',
      selectProduct: 'Hitamo Igicuruzwa uri Kwongerera Stock',
      additionalQty: 'Umubare Wiyongereyeho (+Qty)',
      supplierSource: 'Aho Byaranguriwe (Supplier / Depot)',
      restockReason: 'Impamvu yo Kongera Stock',
      restockBtn: 'Emeza Kwongera Stock'
    },
    card2Modal: {
      title: 'Gucunga Abakozi & Amashifuti',
      subtitle: "Gukurikirana amasaha y'akazi, gushyiramo umukozi mushya, no gutanga contract ya PDF",
      tabShifts: 'Amashifuti & Amasaha',
      tabStaff: 'Kwandika & Gucunga Abakozi',
      tabContracts: "Amasezerano y'Akazi (PDF)",
      newStaffBtn: 'Ongeramo Umukozi Mushya',
      activeStaffTitle: "Urutonde rw'Abakozi b'Iduka",
      contractTitle: "Amasezerano y'Akazi Akurikije Amategeko ya MIFOTRA",
      contractDesc: "Bika cyangwa ucishe amasezerano ku mukozi wemejwe mu buryo bwa PDF.",
      generatePdf: 'Kora Contract ya PDF (Download)'
    },
    card3Modal: {
      title: "Gucunga Ubucuruzi & Imibare y'Inyungu",
      subtitle: "Igenzura ry'inyungu nyakuri na audit y'amafaranga ya Cash na MoMo",
      tabProfits: 'Inyungu & Icuruzwa',
      tabAudit: "Igenzura ry'Ikigega (Audit)",
      periodToday: 'Uyu Munsi',
      period7d: 'Iminsi 7 Ishize',
      periodMonth: 'Uku Kwezi',
      periodAll: 'Igihe Cyose',
      grossSales: 'Amafaranga Yinjiye Yose',
      wholesaleCost: 'Amafaranga yose yaranguwe',
      grossProfit: 'Inyungu Nyakuri (Gross Profit)',
      profitMargin: 'Ijanisha ry\'Inyungu (Margin %)'
    },
    card4Modal: {
      title: 'Kurangura, Facture & Amafaranga Yasohotse',
      subtitle: "Kubika inyemezabwishyu z'ibyaranguwe no kwandika amafaranga yasohotse mu iduka",
      tabInvoices: 'Facture zo Kurangura',
      tabExpenses: 'Amafaranga Yasohotse (Expenses)',
      recordInvoiceBtn: 'Andika Facture Nshya',
      recordExpenseBtn: 'Andika Amafaranga Asosohotse',
      expenseJustification: 'Ibisobanuro bya ngombwa by\'amafaranga asohotse',
      supplierName: 'Izina rya Supplier / Depot'
    },
    card5Modal: {
      title: 'Smart AI Assistant (Umujyanama wa Business)',
      subtitle: "Baza ikibazo cyose kijyanye na stock, inyungu, abakozi, cyangwa amakuru y'iduka",
      disclaimer: 'AI ya SmartStock ikoresha amakuru nyakuri y’iduka yawe muri Kigali.',
      inputPlaceholder: 'Andika ikibazo cyawe hano (urugero: Stock igiye gushira ni iyihe?)...',
      sendBtn: 'Ohereza',
      promptChips: [
        {
          label: '📉 Stock Igiye Gushira (Low Stock)',
          query: 'Ese ni ibihe bicuruzwa bigiye gushira muri stock bikeneye kurangurwa vuba?'
        },
        {
          label: "👥 Umushahara w'Abakozi (Salaries & Payroll)",
          query: "Ni abahe bakozi bazohembwa muri uku kwezi n'amafaranga yose akenewe kuri payroll?"
        },
        {
          label: '🚨 Genzura Ikigega (Cashier Shortages & Audits)',
          query: 'Genzura niba hari ibura rya cash mu kigega cyangwa amafaranga adahuye mu mashifuti.'
        },
        {
          label: '💰 Ibicuruzwa Byunguka Cyane (Top Profit Items)',
          query: "Nerekera ibicuruzwa bifite inyungu nyinshi n'ibicuruza kurusha ibindi."
        },
        {
          label: '🧾 Amafaranga Yasohotse (Expenses & Invoices)',
          query: "Tanga incamake y'amafaranga yasohotse mu iduka n'ibyo twaranguye muri ubu buryo."
        }
      ]
    }
  },
  en: {
    common: {
      online: 'ONLINE',
      offline: 'OFFLINE',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      search: 'Search...',
      loading: 'Processing...',
      rwf: 'RWF',
      actions: 'Actions'
    },
    ownerDashboard: {
      hubBadge: 'KIGALI BUSINESS HUB • RRA COMPLIANT SYSTEM',
      hubTitle: 'Executive Business Management',
      greeting: (name: string) => `Welcome, ${name || 'Store Owner'} 👋`,
      greetingSub: 'Select an action for today: register inventory, track employees and shifts, analyze profits and expenses, or consult the AI Assistant.',
      card1: {
        tag: 'Card 1 • Stock',
        title: 'Register New Stock & Add Product',
        subtitle: 'Add new store products and restock existing inventory quantities.',
        desc: 'Enter new catalog products with wholesale cost and retail pricing, or quickly add restock units for existing items.',
        action: 'Open Stock Card'
      },
      card2: {
        tag: 'Card 2 • Staff',
        title: 'Employee Management & Shift Tracking',
        subtitle: 'Track employee work hours and shifts, onboard or offboard staff, and archive contracts (PDF).',
        desc: 'Monitor staff clock-ins and live shifts, issue secure cashier credentials (PIN & Password), and export official contracts.',
        action: 'Open Staff Management'
      },
      card3: {
        tag: 'Card 3 • Analytics',
        title: 'Business Management & Revenue Analytics',
        subtitle: 'Analyze profits (today or custom dates) and conduct cashier audits (Cash/MoMo balance check).',
        desc: 'Review gross revenue, cost of goods sold, profit margins, and perform blind reconciliations to catch discrepancies.',
        action: 'Open Revenue & Audits'
      },
      card4: {
        tag: 'Card 4 • Invoices',
        title: 'Restock, Invoices & Expense Tracking',
        subtitle: 'Store purchase invoices from suppliers and log shop operating expenses (expenses & payroll).',
        desc: 'Keep records of restocking invoices with receipt attachments and log operational expenditures with required justifications.',
        action: 'Open Invoices & Expenses'
      },
      card5: {
        tag: 'Card 5 • AI Assistant',
        title: 'Smart AI Assistant (AI Business Companion)',
        subtitle: 'Ask AI about your business operations (low stock alerts, upcoming payroll, sales trends).',
        desc: 'Real-time retail AI advisor analyzing current inventory velocity, cash shortages, and operating overhead in your preferred language.',
        action: 'Ask AI Assistant (Ask Store AI)'
      }
    },
    card1Modal: {
      title: 'Register New Stock & Restock Inventory',
      subtitle: 'Add brand new retail catalog products and update warehouse quantities',
      tabNew: 'Register New Product',
      tabRestock: 'Restock Existing Inventory',
      productName: 'Product Name',
      category: 'Category',
      costPrice: 'Wholesale Cost Price (RWF)',
      sellingPrice: 'Retail Selling Price (RWF)',
      floorPrice: 'Minimum Floor Price (RWF)',
      initialStock: 'Initial Received Stock Quantity',
      unit: 'Measurement Unit',
      reorderLevel: 'Low Stock Reorder Threshold',
      expiryDate: 'Expiry Date',
      vatApplicable: 'Subject to VAT (18% RRA EBM)',
      saveProductBtn: 'Save New Product to System',
      selectProduct: 'Select Product to Restock',
      additionalQty: 'Added Units (+Qty)',
      supplierSource: 'Supplier / Depot Source',
      restockReason: 'Restock Purchase Reason',
      restockBtn: 'Confirm Restock Units'
    },
    card2Modal: {
      title: 'Employee Management & Shift Tracking',
      subtitle: 'Monitor attendance, register/deactivate cashiers, and generate MIFOTRA PDF employment contracts',
      tabShifts: 'Shifts & Time Tracking',
      tabStaff: 'Staff Directory & Credentials',
      tabContracts: 'Employment Contracts (PDF)',
      newStaffBtn: 'Add New Employee',
      activeStaffTitle: 'Store Staff Members',
      contractTitle: 'Rwanda MIFOTRA Compliant Employment Contract',
      contractDesc: 'Official employment agreement with RSSB and probationary provisions ready for export.',
      generatePdf: 'Download Signed Contract (PDF)'
    },
    card3Modal: {
      title: 'Business Management & Revenue Analytics',
      subtitle: 'Real-time profitability metrics and cashier register audit verification',
      tabProfits: 'Revenue & Profits',
      tabAudit: 'Register Audit (Cash & MoMo)',
      periodToday: 'Today',
      period7d: 'Last 7 Days',
      periodMonth: 'This Month',
      periodAll: 'All Time',
      grossSales: 'Gross Sales Revenue',
      wholesaleCost: 'Cost of Goods Sold (COGS)',
      grossProfit: 'Net Gross Profit',
      profitMargin: 'Profit Margin (%)'
    },
    card4Modal: {
      title: 'Restock, Invoices & Expense Tracking',
      subtitle: 'Supplier purchase invoice vault and shop operational expense log',
      tabInvoices: 'Purchase Invoices',
      tabExpenses: 'Operating Expenses',
      recordInvoiceBtn: 'Record New Invoice',
      recordExpenseBtn: 'Record Operational Expense',
      expenseJustification: 'Mandatory expense justification & reason',
      supplierName: 'Supplier or Wholesaler Name'
    },
    card5Modal: {
      title: 'Smart AI Assistant (Store Business Companion)',
      subtitle: 'Ask any question about stock depletion, staff payroll, cashier audits, or margin performance',
      disclaimer: 'SmartStock AI runs on real-time Kigali store telemetry and sales logs.',
      inputPlaceholder: 'Type your question here (e.g., Which products are running low in stock?)...',
      sendBtn: 'Send',
      promptChips: [
        {
          label: '📉 Low Stock Alerts',
          query: 'Which products are currently below reorder levels and need restock immediately?'
        },
        {
          label: '👥 Staff Payroll & Salaries',
          query: 'Who needs to be paid this month and what is our total estimated payroll liability?'
        },
        {
          label: '🚨 Cashier Register Audit',
          query: 'Check if there are any cash drawer shortages or mobile money discrepancies in recent shifts.'
        },
        {
          label: '💰 Top Profit Items',
          query: 'Show me the highest grossing and highest margin products in the store.'
        },
        {
          label: '🧾 Expenses & Invoices Summary',
          query: 'Summarize our recent supplier restock invoices and shop operating expenses.'
        }
      ]
    }
  },
  fr: {
    common: {
      online: 'EN LIGNE',
      offline: 'HORS LIGNE',
      close: 'Fermer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      search: 'Rechercher...',
      loading: 'Traitement en cours...',
      rwf: 'RWF',
      actions: 'Actions'
    },
    ownerDashboard: {
      hubBadge: "CENTRE D'AFFAIRES KIGALI • SYSTÈME CONFORME RRA",
      hubTitle: 'Direction Générale & Gestion',
      greeting: (name: string) => `Bienvenue, ${name || 'Propriétaire'} 👋`,
      greetingSub: "Choisissez votre action du jour : enregistrer le stock, gérer les employés et shifts, analyser les bénéfices et dépenses, ou consulter l'Assistant IA.",
      card1: {
        tag: 'Carte 1 • Stock',
        title: 'Enregistrer Nouveau Stock & Produit',
        subtitle: 'Ajouter de nouveaux produits et réapprovisionner les quantités en stock.',
        desc: "Saisissez de nouveaux articles avec prix d'achat et de vente, ou ajoutez rapidement des unités aux articles existants.",
        action: 'Ouvrir la Fiche Stock'
      },
      card2: {
        tag: 'Carte 2 • Personnel',
        title: 'Gestion du Personnel & des Shifts',
        subtitle: 'Suivre les horaires et shifts, embaucher ou retirer des employés et archiver les contrats (PDF).',
        desc: 'Contrôlez les pointages en direct, attribuez des identifiants sécurisés (PIN & Mot de passe) et exportez des contrats officiels.',
        action: 'Ouvrir Gestion Personnel'
      },
      card3: {
        tag: 'Carte 3 • Analyses',
        title: "Gestion d'Entreprise & Analyse des Revenus",
        subtitle: 'Analyser les bénéfices (aujourd’hui ou période choisie) et auditer les caisses (contrôle Cash/MoMo).',
        desc: "Examinez les revenus bruts, le coût des marchandises, les marges et effectuez des vérifications de caisse à l'aveugle.",
        action: 'Ouvrir Revenus & Audits'
      },
      card4: {
        tag: 'Carte 4 • Factures',
        title: 'Approvisionnement, Factures & Dépenses',
        subtitle: "Archiver les factures fournisseurs et enregistrer les dépenses d'exploitation (salaires & charges).",
        desc: "Conservez l'historique des factures de réapprovisionnement et enregistrez les frais généraux avec justificatifs obligatoires.",
        action: 'Ouvrir Factures & Dépenses'
      },
      card5: {
        tag: 'Carte 5 • Assistant IA',
        title: 'Assistant IA Intelligent (Conseiller IA)',
        subtitle: 'Posez vos questions à l’IA sur vos opérations (alertes stock bas, salaires à payer, ventes).',
        desc: 'Conseiller IA de commerce en temps réel analysant la rotation des stocks, les écarts de caisse et les charges en français, anglais ou kinyarwanda.',
        action: "Consulter l'Assistant IA"
      }
    },
    card1Modal: {
      title: 'Enregistrer Nouveau Stock & Réapprovisionner',
      subtitle: 'Ajouter des produits au catalogue et mettre à jour les quantités en entrepôt',
      tabNew: 'Enregistrer Nouveau Produit',
      tabRestock: 'Réapprovisionner Stock Existant',
      productName: 'Nom du Produit',
      category: 'Catégorie',
      costPrice: "Prix d'Achat Grossiste (RWF)",
      sellingPrice: 'Prix de Vente Détail (RWF)',
      floorPrice: 'Prix Plancher Minimum (RWF)',
      initialStock: 'Quantité Initiale Reçue',
      unit: 'Unité de Mesure',
      reorderLevel: 'Seuil de Réapprovisionnement',
      expiryDate: "Date d'Expiration",
      vatApplicable: 'Soumis à la TVA (18% RRA EBM)',
      saveProductBtn: 'Enregistrer le Produit dans le Système',
      selectProduct: 'Sélectionner le Produit à Réapprovisionner',
      additionalQty: 'Unités Ajoutées (+Qté)',
      supplierSource: 'Fournisseur / Dépôt',
      restockReason: "Motif de l'Achat",
      restockBtn: 'Confirmer le Réassort'
    },
    card2Modal: {
      title: 'Gestion du Personnel & des Shifts',
      subtitle: 'Suivre la présence, gérer les accès caissiers et générer les contrats conformes MIFOTRA',
      tabShifts: 'Shifts & Suivi du Temps',
      tabStaff: 'Répertoire & Identifiants du Personnel',
      tabContracts: 'Contrats de Travail (PDF)',
      newStaffBtn: 'Ajouter un Employé',
      activeStaffTitle: 'Membres du Personnel',
      contractTitle: 'Contrat de Travail Conforme MIFOTRA Rwanda',
      contractDesc: "Contrat de travail officiel avec clauses RSSB et période d'essai prêt pour export PDF.",
      generatePdf: 'Télécharger le Contrat (PDF)'
    },
    card3Modal: {
      title: "Gestion d'Entreprise & Analyse des Revenus",
      subtitle: 'Indicateurs de rentabilité en temps réel et vérification des audits de caisse',
      tabProfits: 'Revenus & Bénéfices',
      tabAudit: 'Audit de Caisse (Espèces & MoMo)',
      periodToday: "Aujourd'hui",
      period7d: '7 Derniers Jours',
      periodMonth: 'Ce Mois-ci',
      periodAll: 'Toutes Périodes',
      grossSales: 'Chiffre d’Affaires Brut',
      wholesaleCost: 'Coût d’Achat des Ventes',
      grossProfit: 'Bénéfice Brut Net',
      profitMargin: 'Marge Bénéficiaire (%)'
    },
    card4Modal: {
      title: 'Approvisionnement, Factures & Dépenses',
      subtitle: "Coffre-fort des factures d'achat et registre des dépenses d'exploitation",
      tabInvoices: "Factures d'Achat",
      tabExpenses: "Dépenses d'Exploitation",
      recordInvoiceBtn: 'Nouvelle Facture Fournisseur',
      recordExpenseBtn: 'Enregistrer une Dépense',
      expenseJustification: 'Justification obligatoire de la dépense',
      supplierName: 'Nom du Fournisseur ou Grossiste'
    },
    card5Modal: {
      title: 'Assistant IA Intelligent (Conseiller de Boutique)',
      subtitle: 'Posez toutes vos questions sur les ruptures de stock, la paie, les audits ou la rentabilité',
      disclaimer: 'SmartStock IA fonctionne avec les données réelles et les ventes de votre commerce à Kigali.',
      inputPlaceholder: 'Tapez votre question ici (ex: Quels produits sont en rupture de stock ?)...',
      sendBtn: 'Envoyer',
      promptChips: [
        {
          label: '📉 Alertes Stock Faible',
          query: 'Quels produits sont sous le seuil de réapprovisionnement et doivent être commandés ?'
        },
        {
          label: '👥 Salaires & Paie du Personnel',
          query: 'Quels employés doivent être payés ce mois-ci et quel est le montant total de la paie ?'
        },
        {
          label: '🚨 Audit des Caisses',
          query: 'Vérifiez s’il y a des écarts de caisse en espèces ou Mobile Money lors des récents shifts.'
        },
        {
          label: '💰 Produits les Plus Rentables',
          query: 'Montrez-moi les produits avec le plus gros chiffre d’affaires et la meilleure marge.'
        },
        {
          label: '🧾 Résumé Factures & Dépenses',
          query: 'Résumez les récentes factures fournisseurs et les frais d’exploitation du magasin.'
        }
      ]
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('smartstock_language');
      if (saved === 'rw' || saved === 'en' || saved === 'fr') {
        return saved as Language;
      }
    } catch {
      // ignore
    }
    return 'rw';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('smartstock_language', lang);
    } catch {
      // ignore
    }
  };

  const t = TRANSLATIONS_DICTIONARY[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'rw',
      setLanguage: () => {},
      t: TRANSLATIONS_DICTIONARY.rw
    };
  }
  return context;
};
