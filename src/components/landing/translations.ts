export type Language = 'rw' | 'en' | 'fr';

export interface TranslationData {
  langCode: Language;
  flag: string;
  label: string;
  nav: {
    login: string;
    cashierLogin: string;
    ownerLogin: string;
  };
  auth: {
    emailOrPhone: string;
    password: string;
    login: string;
    forgotPassword: string;
    registerCta: string;
    selectRole: string;
    roleOwner: string;
    roleCashier: string;
    roleEmployee: string;
  };
  hero: {
    badge: string;
    headline: string;
    subtitle: string;
    primaryCta: string;
  };
  problems: {
    eyebrow: string;
    title: string;
    subtitle: string;
    card1: {
      title: string;
      desc: string;
      tag: string;
      footer: string;
    };
    card2: {
      title: string;
      desc: string;
      tag: string;
      footer: string;
    };
    card3: {
      title: string;
      desc: string;
      tag: string;
      footer: string;
    };
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    setupBadge: string;
    setupTitle: string;
    setupPrice: string;
    setupPriceSub: string;
    setupDesc: string;
    setupF1: string;
    setupF2: string;
    setupF3: string;
    setupCta: string;
    monthlyPopular: string;
    monthlyBadge: string;
    monthlyTitle: string;
    monthlyPrice: string;
    monthlyPriceSub: string;
    monthlyDesc: string;
    monthlyF1: string;
    monthlyF2: string;
    monthlyF3: string;
    monthlyCta: string;
    calcHeader: string;
    calcLossPerDay: string;
    calcLoss30d: string;
    calcLoss365d: string;
    calcGainWithSmartStock: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    shopLabel: string;
    shopPlaceholder: string;
    locationLabel: string;
    submitBtn: string;
    submittingBtn: string;
    successTitle: string;
    successDesc1: string;
    successDesc2: string;
    successCall: string;
    newRequestBtn: string;
  };
  footer: {
    rights: string;
    contactUs: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationData> = {
  rw: {
    langCode: 'rw',
    flag: '🇷🇼',
    label: 'Kinyarwanda',
    nav: {
      login: 'Kwinjira',
      cashierLogin: 'Cashier Login',
      ownerLogin: 'Register / Owner Login',
    },
    auth: {
      emailOrPhone: 'Email cyangwa Telefoni',
      password: 'Ijambobanga (Password)',
      login: 'Kwinjira',
      forgotPassword: 'Wibagiwe ijambobanga?',
      registerCta: "Nta konti y'ubucuruzi ufite? Iyandikishe ubucuruzi bwawe",
      selectRole: 'Hitamo Umurimo (Role)',
      roleOwner: 'Umuyobozi (Owner)',
      roleCashier: 'Kasiyeri (Cashier)',
      roleEmployee: 'Umukozi (Employee)',
    },
    hero: {
      badge: 'SmartStock Rwanda POS',
      headline: 'Ubucuruzi Bwawe Mu Ntoki Zawe Buri Munsi',
      subtitle: "Hagarika ubujura, genzura stock n'abakozi kuri telefone yawe, no gukora fagitire za RRA EBM mu buryo bwihuse.",
      primaryCta: 'Register New Owner / Login',
    },
    problems: {
      eyebrow: '• Ibyingenzi SmartStock Ikemura / Core Problems Solved',
      title: 'Uburyo Butatu Bukomeye bwo Kurinda Ubucuruzi Bwawe',
      subtitle: "Genzura neza buri faranga ryinjira n'ibicuruzwa bisohoka muri supermarket cyangwa shop yawe.",
      card1: {
        title: 'Real-Time Stock & Sales Notifications',
        desc: "Ubutumwa bwihuse kuri Email na SMS bugera kuri nyir'iduka muri ako kanya igihe cyose stock ihindutse, habayeho kurangura (restock), cyangwa igurisha (sales transaction) rikozwe mu iduka.",
        tag: 'Instant Alerts',
        footer: 'Email & SMS Notifications',
      },
      card2: {
        title: 'SMS Alert Instant ku Bakozi',
        desc: "Igihe cyose ububiko bwongewemo ibicuruzwa (Restock) cyangwa ibiciro bihindutse, abakozi bose bakira ubutumwa bwa SMS bwihuse. Nyir'iduka na we akurikirana amakuru yose ya stock n'amafaranga muri ako kanya.",
        tag: 'MTN / Airtel SMS',
        footer: 'Instant SMS Delivery',
      },
      card3: {
        title: 'Fagitire za RRA VAT EBM',
        desc: "Gukora fagitire zemewe n'Urwego rw'Imisoro n'Amahoro (RRA) mu buryo bw'akanyabyatita kuri buri kintu kigurishijwe. Irimo 18% VAT, SDC device signature, na SMS e-receipt yoherezwa ku mukiriya.",
        tag: '18% VAT EIS Law',
        footer: 'SDC Certified',
      },
    },
    pricing: {
      eyebrow: 'Igiciro Cyumvikana kandi Cyizewe',
      title: 'Gukoresha SmartStock Birakwishyura Guhera ku Munsi wa Mbere',
      subtitle: 'Guhagarika ibihombo no kumenya amakuru yose ya stock ku gihe bituma ubucuruzi bwunguka ku munsi wa mbere.',
      setupBadge: 'In-Person Kigali',
      setupTitle: 'Gushyiramo no Guhugura',
      setupPrice: '30,000',
      setupPriceSub: 'RWF (Rimwe gusa)',
      setupDesc: "Umukozi w'inzobere asura supermarket yawe, agashyiramo porogaramu kuri mudasobwa na scanner, agashyiramo ibicuruzwa byawe, akanahugura abakozi ku gukoresha POS.",
      setupF1: 'Gusura iduka ryawe i Kigali',
      setupF2: 'Guhuza barcode scanner na receipt printer',
      setupF3: "Guhugura abakozi no gushyiraho PINs zabo",
      setupCta: 'Fata Gahunda yo Gusurwa',
      monthlyPopular: 'Ikunzwe Cyane',
      monthlyBadge: 'Buri Kwezi',
      monthlyTitle: "Ifatabuguzi ry'Ukwezi",
      monthlyPrice: '8,000',
      monthlyPriceSub: 'RWF / ukwezi',
      monthlyDesc: "Gukurikirana iduka ryawe kuri telefone n'ahandi hose, SMS alerts z'abakozi, blind reconciliation, na fagitire za RRA 18% VAT zitagira umupaka.",
      monthlyF1: "Konti z'abakozi na PINs zitagira umupaka",
      monthlyF2: "SMS alert kuri telefone y'umuyobozi igihe kase ibuze",
      monthlyF3: 'Fagitire za RRA 18% VAT EBM na E-Receipts',
      monthlyCta: 'Tangira Nonaha (MTN MoMo)',
      calcHeader: 'Reba Amafaranga Uzigama (Daily Loss Calculator)',
      calcLossPerDay: 'Ibihombo byo mu bubiko ku munsi',
      calcLoss30d: 'Ibyo watakazaga mu Kwezi (30d)',
      calcLoss365d: 'Ibyo watakazaga mu Mwaka (365d)',
      calcGainWithSmartStock: 'Inyungu Zisigara Ufashe SmartStock',
    },
    contact: {
      eyebrow: 'Gusura Iduka ryawe Imbonankubone',
      title: 'Wifuza Kutuvugisha?',
      subtitle: 'Uzuza iyi fomu kugira ngo inzobere yacu igusure mu iduka ryawe i Kigali igufashe kubara no gushyiraho SmartStock ku buntu.',
      nameLabel: 'Izina Ryuzuye (Full Name) *',
      namePlaceholder: 'Urugero: Emmanuel Ndayisaba',
      phoneLabel: 'Nimero ya Telefone (Phone Number) *',
      shopLabel: 'Izina rya Supermarket / Shop *',
      shopPlaceholder: 'Urugero: Kigali Fresh Alimentation',
      locationLabel: 'Aho Iherereye (Location) *',
      submitBtn: 'Saba Gusurwa ku Duka ryawe (Request Visit)',
      submittingBtn: 'Turi kohereza ubusabe...',
      successTitle: 'Murakoze',
      successDesc1: 'Ubusabe bwanyu bwo gusurwa ku iduka rya',
      successDesc2: 'bwakiriwe neza.',
      successCall: 'Umukozi wacu araguhamagara kuri telefone mu kanya gato.',
      newRequestBtn: 'Ohereza Ubundi Busabe',
    },
    footer: {
      rights: 'Anti-Theft Retail OS & RRA Invoicing',
      contactUs: 'Tuvugishe',
    },
  },
  en: {
    langCode: 'en',
    flag: '🇬🇧',
    label: 'English',
    nav: {
      login: 'Login',
      cashierLogin: 'Cashier Login',
      ownerLogin: 'Register / Owner Login',
    },
    auth: {
      emailOrPhone: 'Email or Phone',
      password: 'Password (Ijambobanga)',
      login: 'Login',
      forgotPassword: 'Forgot password?',
      registerCta: "Don't have a business account? Register your business",
      selectRole: 'Select Role',
      roleOwner: 'Owner',
      roleCashier: 'Cashier',
      roleEmployee: 'Employee',
    },
    hero: {
      badge: 'SmartStock Rwanda POS',
      headline: 'Your Business in Your Hands Every Day',
      subtitle: 'Stop employee cash leaks, track stock & cashier shifts from your phone, and generate instant RRA EBM electronic invoices.',
      primaryCta: 'Register New Owner / Login',
    },
    problems: {
      eyebrow: '• Core Problems Solved by SmartStock',
      title: 'Three Essential Ways to Protect Your Business',
      subtitle: 'Carefully monitor every franc collected and every piece of merchandise sold in your supermarket or shop.',
      card1: {
        title: 'Real-Time Stock & Sales Notifications',
        desc: 'Instant email and SMS alerts delivered to shop owners whenever stock levels change, restocks occur, or sales transactions are processed in the store.',
        tag: 'Instant Alerts',
        footer: 'Email & SMS Notifications',
      },
      card2: {
        title: 'Instant SMS Alerts to Staff & Owners',
        desc: 'Every time inventory is restocked or retail prices are adjusted, all registered staff receive instant SMS updates. Owners receive live transaction notifications directly on their phone.',
        tag: 'MTN / Airtel SMS',
        footer: 'Instant SMS Delivery',
      },
      card3: {
        title: '18% RRA VAT EBM Invoices',
        desc: 'Issue certified Rwanda Revenue Authority (RRA) electronic tax invoices effortlessly with every sale. Compliant with 18% VAT, signed SDC device tokens, and digital SMS e-receipts for buyers.',
        tag: '18% VAT EIS Law',
        footer: 'SDC Certified',
      },
    },
    pricing: {
      eyebrow: 'Transparent & High-ROI Pricing',
      title: 'SmartStock Pays for Itself from Day One',
      subtitle: 'Automated stock tracking and real-time sales alerts ensure maximum retail efficiency and profitability from day one.',
      setupBadge: 'In-Person Kigali',
      setupTitle: 'Onsite Setup & Staff Training',
      setupPrice: '30,000',
      setupPriceSub: 'RWF (One-time)',
      setupDesc: 'A dedicated retail expert visits your supermarket, installs the software on your PC and barcode scanner, uploads your catalog, and trains your team on POS operations.',
      setupF1: 'Onsite physical visit in Kigali',
      setupF2: 'Connect barcode scanner & receipt printer',
      setupF3: 'Train staff & configure private cashier PINs',
      setupCta: 'Schedule Onsite Visit',
      monthlyPopular: 'Most Popular',
      monthlyBadge: 'Monthly',
      monthlyTitle: 'Monthly Software Plan',
      monthlyPrice: '8,000',
      monthlyPriceSub: 'RWF / month',
      monthlyDesc: 'Real-time remote store monitoring, instant staff SMS alerts, blind cashier shift audits, and unlimited 18% RRA VAT invoicing.',
      monthlyF1: 'Unlimited employee accounts & PINs',
      monthlyF2: 'Automated owner SMS alert when drawer is short',
      monthlyF3: '18% RRA VAT EBM invoices & SMS e-receipts',
      monthlyCta: 'Get Started Now (MTN MoMo)',
      calcHeader: 'Calculate Your Monthly Savings (Daily Loss Calculator)',
      calcLossPerDay: 'Estimated daily inventory loss',
      calcLoss30d: 'Losses over 1 Month (30d)',
      calcLoss365d: 'Losses over 1 Year (365d)',
      calcGainWithSmartStock: 'Net Saved with SmartStock',
    },
    contact: {
      eyebrow: 'In-Person Store Inspection',
      title: 'Would You Like to Talk to Us?',
      subtitle: 'Fill out this brief form and our specialist will visit your shop in Kigali to evaluate your workflow and set up SmartStock free of obligation.',
      nameLabel: 'Full Name *',
      namePlaceholder: 'e.g., Emmanuel Ndayisaba',
      phoneLabel: 'Phone Number *',
      shopLabel: 'Supermarket / Shop Name *',
      shopPlaceholder: 'e.g., Kigali Fresh Alimentation',
      locationLabel: 'Location *',
      submitBtn: 'Request Free Shop Visit',
      submittingBtn: 'Sending request...',
      successTitle: 'Thank You',
      successDesc1: 'Your request for a shop visit at',
      successDesc2: 'has been successfully received.',
      successCall: 'Our Kigali specialist will phone you shortly.',
      newRequestBtn: 'Submit Another Request',
    },
    footer: {
      rights: 'Anti-Theft Retail OS & RRA Invoicing',
      contactUs: 'Contact Us',
    },
  },
  fr: {
    langCode: 'fr',
    flag: '🇫🇷',
    label: 'Français',
    nav: {
      login: 'Se connecter',
      cashierLogin: 'Connexion Caissier',
      ownerLogin: 'Créer / Connexion Gérant',
    },
    auth: {
      emailOrPhone: 'E-mail ou Téléphone',
      password: 'Mot de passe',
      login: 'Se connecter',
      forgotPassword: 'Mot de passe oublié ?',
      registerCta: "Pas encore de compte professionnel ? Enregistrez votre entreprise",
      selectRole: 'Sélectionner le rôle',
      roleOwner: 'Propriétaire',
      roleCashier: 'Caissier',
      roleEmployee: 'Employé',
    },
    hero: {
      badge: 'SmartStock Rwanda POS',
      headline: 'Votre Commerce Entre Vos Mains au Quotidien',
      subtitle: 'Éliminez le coulage financier, contrôlez les stocks et caissiers depuis votre mobile, et émettez instantanément des factures RRA EBM.',
      primaryCta: 'Créer un Compte Propriétaire / Connexion',
    },
    problems: {
      eyebrow: '• Principaux Problèmes Résolus par SmartStock',
      title: 'Trois Façons Essentielles de Protéger Votre Entreprise',
      subtitle: 'Contrôlez avec précision chaque franc encaissé et chaque marchandise sortant de votre supermarché ou boutique.',
      card1: {
        title: 'Real-Time Stock & Sales Notifications',
        desc: "Alertes instantanées par email et SMS envoyées aux propriétaires de magasins dès que les niveaux de stock changent, lors des réapprovisionnements ou à chaque transaction de vente.",
        tag: 'Alertes Instantanées',
        footer: 'Notifications Email & SMS',
      },
      card2: {
        title: 'Alertes SMS Instantanées Équipes & Gérant',
        desc: "Dès qu'un réassort est effectué ou qu'un prix de vente est modifié, les employés reçoivent une notification SMS immédiate. Le propriétaire surveille en temps réel les mouvements financiers.",
        tag: 'SMS MTN / Airtel',
        footer: 'Distribution SMS Immédiate',
      },
      card3: {
        title: 'Facturation 18% TVA EBM RRA',
        desc: "Générez des factures électroniques certifiées par l'Office Rwandais des Recettes (RRA). Conforme au taux de 18% TVA, signature électronique SDC sécurisée et reçu numérique SMS pour le client.",
        tag: 'Loi 18% TVA EIS',
        footer: 'Certifié SDC RRA',
      },
    },
    pricing: {
      eyebrow: 'Tarifs Clairs & Rentabilité Immédiate',
      title: 'SmartStock est Rentabilisé Dès le Premier Jour',
      subtitle: "Le suivi automatisé des stocks et les alertes en temps réel garantissent une rentabilité et une sérénité dès le premier jour.",
      setupBadge: 'En Présentiel à Kigali',
      setupTitle: 'Installation & Formation des Équipes',
      setupPrice: '30,000',
      setupPriceSub: 'RWF (Paiement Unique)',
      setupDesc: "Un spécialiste se déplace dans votre supermarché, installe le logiciel sur votre ordinateur et lecteur code-barres, configure vos articles et forme votre équipe à la caisse.",
      setupF1: 'Visite physique de votre magasin à Kigali',
      setupF2: 'Raccordement lecteur code-barres et imprimante tickets',
      setupF3: 'Formation du personnel et attribution des codes PIN',
      setupCta: 'Planifier une Visite sur Place',
      monthlyPopular: 'Le Plus Populaire',
      monthlyBadge: 'Mensuel',
      monthlyTitle: 'Abonnement Mensuel Logiciel',
      monthlyPrice: '8,000',
      monthlyPriceSub: 'RWF / mois',
      monthlyDesc: 'Surveillance à distance sur smartphone, alertes SMS pour le personnel, réconciliation aveugle des caisses et factures RRA TVA illimitées.',
      monthlyF1: 'Comptes employés et codes PIN illimités',
      monthlyF2: 'Alerte SMS automatique au gérant en cas de caisse manquante',
      monthlyF3: 'Factures conformes RRA 18% TVA EBM et reçus SMS',
      monthlyCta: 'Commencer Maintenant (MTN MoMo)',
      calcHeader: 'Calculez Vos Économies Mensuelles (Calculateur de Pertes)',
      calcLossPerDay: 'Perte estimée par jour',
      calcLoss30d: 'Pertes sur 1 Mois (30j)',
      calcLoss365d: 'Pertes sur 1 An (365j)',
      calcGainWithSmartStock: 'Bénéfice Net Économisé avec SmartStock',
    },
    contact: {
      eyebrow: 'Visite sur Place dans Votre Magasin',
      title: 'Souhaitez-vous Nous Contacter ?',
      subtitle: 'Remplissez ce formulaire et notre spécialiste viendra évaluer votre commerce à Kigali et déployer SmartStock sans engagement.',
      nameLabel: 'Nom Complet *',
      namePlaceholder: 'Ex: Emmanuel Ndayisaba',
      phoneLabel: 'Numéro de Téléphone *',
      shopLabel: 'Nom du Supermarché / Boutique *',
      shopPlaceholder: 'Ex: Kigali Fresh Alimentation',
      locationLabel: 'Emplacement *',
      submitBtn: 'Demander une Visite Gratuite en Boutique',
      submittingBtn: 'Envoi de votre demande...',
      successTitle: 'Merci',
      successDesc1: 'Votre demande de visite pour le commerce',
      successDesc2: 'a été enregistrée avec succès.',
      successCall: 'Notre conseiller à Kigali vous contactera par téléphone très rapidement.',
      newRequestBtn: 'Envoyer une Autre Demande',
    },
    footer: {
      rights: 'Système Anti-Vol & Facturation Fiscale RRA',
      contactUs: 'Nous Contacter',
    },
  },
};
