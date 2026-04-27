/**
 * Scoped i18n/translations system for Renewly
 * 
 * This provides real translations for key UI areas without overclaiming 
 * full multilingual support. It covers:
 * - Settings labels and descriptions
 * - Common UI copy (buttons, headings)
 * - Toast messages
 * - Key error/success states
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'hi'

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी',
}

// Translation keys organized by section
export interface Translations {
  // Common
  save: string
  cancel: string
  close: string
  loading: string
  success: string
  error: string
  confirm: string
  delete: string
  edit: string
  add: string
  
  // Navigation
  dashboard: string
  calendar: string
  analytics: string
  leakReport: string
  smartInbox: string
  integrations: string
  notifications: string
  settings: string
  addSubscription: string
  more: string
  
  // Dashboard
  financialCommandCenter: string
  monthlySpend: string
  annualProjected: string
  potentialSavings: string
  subscriptionHealthScore: string
  needsAttention: string
  yourSubscriptions: string
  upcomingRenewals: string
  viewReport: string
  displayedIn: string
  noSubscriptionsYet: string
  noSubscriptionsMatch: string

  // Settings
  settingsDescription: string
  account: string
  security: string
  appearance: string
  support: string
  dataStorage: string
  
  // Account section
  planBilling: string
  currentPlan: string
  upgradePlan: string
  viewUpgradeOptions: string
  
  // Notifications section
  pushNotifications: string
  browserPushNotifications: string
  browserPushDesc: string
  browserPushNote: string
  emailNotifications: string
  emailNotificationsDesc: string
  reminderTiming: string
  reminderTimingDesc: string
  daysBeforeRenewal: string
  
  // Security section
  changePassword: string
  emailAddress: string
  phoneNumber: string
  phoneNotConfigured: string
  biometricLogin: string
  biometricDesc: string
  biometricNotSupported: string
  
  // Password form
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
  passwordRules: string
  passwordMinLength: string
  passwordUppercase: string
  passwordLowercase: string
  passwordNumber: string
  passwordSpecial: string
  passwordsMatch: string
  passwordsDontMatch: string
  wrongCurrentPassword: string
  passwordUpdated: string
  updatePassword: string
  
  // Phone form
  addPhoneNumber: string
  editPhoneNumber: string
  phoneVerified: string
  phoneUnverified: string
  verifyPhone: string
  verificationNotConfigured: string
  sendVerificationCode: string
  enterVerificationCode: string
  
  // Appearance section
  darkMode: string
  currency: string
  language: string
  languageUpdated: string
  currencyUpdated: string
  
  // Data section
  exportData: string
  exportAsCSV: string
  exportAsJSON: string
  fullAccountBackup: string
  exportComplete: string
  
  // Support section
  helpCenter: string
  termsOfService: string
  privacyPolicy: string
  
  // Profile
  editProfile: string
  fullName: string
  saveProfile: string
  profileUpdated: string
  
  // Sign out
  signOut: string
  signingOut: string
  
  // Toasts
  settingsSaved: string
  errorOccurred: string
  tryAgain: string
}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    analytics: 'Analytics',
    leakReport: 'Leak Report',
    smartInbox: 'Smart Inbox',
    integrations: 'Integrations',
    notifications: 'Notifications',
    settings: 'Settings',
    addSubscription: 'Add Subscription',
    more: 'More',
    
    // Dashboard
    financialCommandCenter: 'Financial Command Center',
    monthlySpend: 'Monthly Spend',
    annualProjected: 'Annual Projected',
    potentialSavings: 'Potential Savings',
    subscriptionHealthScore: 'Subscription Health Score',
    needsAttention: 'Needs Attention',
    yourSubscriptions: 'Your Subscriptions',
    upcomingRenewals: 'Upcoming Renewals',
    viewReport: 'View Report',
    displayedIn: 'Displayed in',
    noSubscriptionsYet: 'No subscriptions yet',
    noSubscriptionsMatch: 'No subscriptions match your search',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    
    // Settings
    settingsDescription: 'Manage your account and preferences',
    account: 'Account',
    security: 'Security',
    appearance: 'Appearance',
    support: 'Support',
    dataStorage: 'Data & Storage',
    
    // Account section
    planBilling: 'Plan & Billing',
    currentPlan: 'Current Plan',
    upgradePlan: 'Upgrade Plan',
    viewUpgradeOptions: 'View Upgrade Options',
    
    // Notifications section
    browserPushNotifications: 'Browser Push Notifications',
    browserPushDesc: 'Receive renewal reminders on this browser/device',
    browserPushNote: 'For iPhone/iPad, add Renewly to your Home Screen to enable web push. Push delivery setup is being finalized.',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
    emailNotificationsDesc: 'Weekly summaries',
    reminderTiming: 'Reminder Timing',
    reminderTimingDesc: 'days before renewal',
    daysBeforeRenewal: 'days before',
    
    // Security section
    changePassword: 'Change Password',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    phoneNotConfigured: 'Add your phone number',
    biometricLogin: 'Biometric Login',
    biometricDesc: 'Face ID / Touch ID',
    biometricNotSupported: 'Not supported on this device',
    
    // Password form
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordRules: 'Password Requirements',
    passwordMinLength: 'At least 8 characters',
    passwordUppercase: 'One uppercase letter',
    passwordLowercase: 'One lowercase letter',
    passwordNumber: 'One number',
    passwordSpecial: 'One special character (!@#$%^&*)',
    passwordsMatch: 'Passwords match',
    passwordsDontMatch: 'Passwords do not match',
    wrongCurrentPassword: 'Current password is incorrect',
    passwordUpdated: 'Password updated successfully',
    updatePassword: 'Update Password',
    
    // Phone form
    addPhoneNumber: 'Add Phone Number',
    editPhoneNumber: 'Edit Phone Number',
    phoneVerified: 'Verified',
    phoneUnverified: 'Not verified',
    verifyPhone: 'Verify Phone',
    verificationNotConfigured: 'SMS verification is not yet configured. Your phone number will be saved but cannot be verified at this time.',
    sendVerificationCode: 'Send Verification Code',
    enterVerificationCode: 'Enter verification code',
    
    // Appearance section
    darkMode: 'Dark Mode',
    currency: 'Currency',
    language: 'Language',
    languageUpdated: 'Language updated',
    currencyUpdated: 'Currency updated',
    
    // Data section
    exportData: 'Export Data',
    exportAsCSV: 'Export as CSV',
    exportAsJSON: 'Export as JSON',
    fullAccountBackup: 'Full account backup',
    exportComplete: 'Export complete',
    
    // Support section
    helpCenter: 'Help Center',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    
    // Profile
    editProfile: 'Edit Profile',
    fullName: 'Full Name',
    saveProfile: 'Save Profile',
    profileUpdated: 'Profile updated',
    
    // Sign out
    signOut: 'Sign Out',
    signingOut: 'Signing out...',
    
    // Toasts
    settingsSaved: 'Settings saved',
    errorOccurred: 'An error occurred',
    tryAgain: 'Please try again',
  },
  
  es: {
    // Navigation
    dashboard: 'Dashboard',
    calendar: 'Calendario',
    analytics: 'Análisis',
    leakReport: 'Reporte de Fugas',
    smartInbox: 'Bandeja Inteligente',
    integrations: 'Integraciones',
    notifications: 'Notificaciones',
    settings: 'Configuración',
    addSubscription: 'Agregar Suscripción',
    more: 'Más',
    
    // Dashboard
    financialCommandCenter: 'Centro de Control Financiero',
    monthlySpend: 'Gasto Mensual',
    annualProjected: 'Proyección Anual',
    potentialSavings: 'Ahorros Potenciales',
    subscriptionHealthScore: 'Puntuación de Salud',
    needsAttention: 'Necesita Atención',
    yourSubscriptions: 'Tus Suscripciones',
    upcomingRenewals: 'Renovaciones Próximas',
    viewReport: 'Ver Reporte',
    displayedIn: 'Mostrado en',
    noSubscriptionsYet: 'Sin suscripciones aún',
    noSubscriptionsMatch: 'Ninguna suscripción coincide',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    
    // Settings
    settingsDescription: 'Administra tu cuenta y preferencias',
    account: 'Cuenta',
    security: 'Seguridad',
    appearance: 'Apariencia',
    support: 'Soporte',
    dataStorage: 'Datos y Almacenamiento',
    
    // Account section
    planBilling: 'Plan y Facturación',
    currentPlan: 'Plan Actual',
    upgradePlan: 'Mejorar Plan',
    viewUpgradeOptions: 'Ver Opciones de Mejora',
    
    // Notifications section
    browserPushNotifications: 'Notificaciones Push del Navegador',
    browserPushDesc: 'Recibe recordatorios de renovación en este navegador/dispositivo',
    browserPushNote: 'Para iPhone/iPad, agrega Renewly a tu pantalla de inicio para habilitar web push. La configuración de entrega de push se está finalizando.',
    pushNotifications: 'Notificaciones Push',
    emailNotifications: 'Notificaciones por Email',
    emailNotificationsDesc: 'Resúmenes semanales',
    reminderTiming: 'Tiempo de Recordatorio',
    reminderTimingDesc: 'días antes de la renovación',
    daysBeforeRenewal: 'días antes',
    
    // Security section
    changePassword: 'Cambiar Contraseña',
    emailAddress: 'Correo Electrónico',
    phoneNumber: 'Número de Teléfono',
    phoneNotConfigured: 'Agrega tu número de teléfono',
    biometricLogin: 'Inicio Biométrico',
    biometricDesc: 'Face ID / Touch ID',
    biometricNotSupported: 'No compatible con este dispositivo',
    
    // Password form
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    passwordRules: 'Requisitos de Contraseña',
    passwordMinLength: 'Al menos 8 caracteres',
    passwordUppercase: 'Una letra mayúscula',
    passwordLowercase: 'Una letra minúscula',
    passwordNumber: 'Un número',
    passwordSpecial: 'Un carácter especial (!@#$%^&*)',
    passwordsMatch: 'Las contraseñas coinciden',
    passwordsDontMatch: 'Las contraseñas no coinciden',
    wrongCurrentPassword: 'La contraseña actual es incorrecta',
    passwordUpdated: 'Contraseña actualizada exitosamente',
    updatePassword: 'Actualizar Contraseña',
    
    // Phone form
    addPhoneNumber: 'Agregar Número de Teléfono',
    editPhoneNumber: 'Editar Número de Teléfono',
    phoneVerified: 'Verificado',
    phoneUnverified: 'No verificado',
    verifyPhone: 'Verificar Teléfono',
    verificationNotConfigured: 'La verificación por SMS aún no está configurada. Tu número de teléfono se guardará pero no podrá ser verificado en este momento.',
    sendVerificationCode: 'Enviar Código de Verificación',
    enterVerificationCode: 'Ingresa el código de verificación',
    
    // Appearance section
    darkMode: 'Modo Oscuro',
    currency: 'Moneda',
    language: 'Idioma',
    languageUpdated: 'Idioma actualizado',
    currencyUpdated: 'Moneda actualizada',
    
    // Data section
    exportData: 'Exportar Datos',
    exportAsCSV: 'Exportar como CSV',
    exportAsJSON: 'Exportar como JSON',
    fullAccountBackup: 'Respaldo completo de cuenta',
    exportComplete: 'Exportación completa',
    
    // Support section
    helpCenter: 'Centro de Ayuda',
    termsOfService: 'Términos de Servicio',
    privacyPolicy: 'Política de Privacidad',
    
    // Profile
    editProfile: 'Editar Perfil',
    fullName: 'Nombre Completo',
    saveProfile: 'Guardar Perfil',
    profileUpdated: 'Perfil actualizado',
    
    // Sign out
    signOut: 'Cerrar Sesión',
    signingOut: 'Cerrando sesión...',
    
    // Toasts
    settingsSaved: 'Configuración guardada',
    errorOccurred: 'Ocurrió un error',
    tryAgain: 'Por favor intenta de nuevo',
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    calendar: 'Calendrier',
    analytics: 'Analyse',
    leakReport: 'Rapport de Fuite',
    smartInbox: 'Boîte Intelligente',
    integrations: 'Intégrations',
    notifications: 'Notifications',
    settings: 'Paramètres',
    addSubscription: 'Ajouter Abonnement',
    more: 'Plus',
    
    // Dashboard
    financialCommandCenter: 'Centre de Commande Financier',
    monthlySpend: 'Dépenses Mensuelles',
    annualProjected: 'Projection Annuelle',
    potentialSavings: 'Économies Potentielles',
    subscriptionHealthScore: 'Score de Santé',
    needsAttention: 'Nécessite Attention',
    yourSubscriptions: 'Vos Abonnements',
    upcomingRenewals: 'Renouvellements À Venir',
    viewReport: 'Voir le Rapport',
    displayedIn: 'Affiché en',
    noSubscriptionsYet: 'Aucun abonnement pour l\'instant',
    noSubscriptionsMatch: 'Aucun abonnement ne correspond',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    loading: 'Chargement...',
    success: 'Succès',
    error: 'Erreur',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    
    // Settings
    settingsDescription: 'Gérez votre compte et vos préférences',
    account: 'Compte',
    security: 'Sécurité',
    appearance: 'Apparence',
    support: 'Support',
    dataStorage: 'Données et Stockage',
    
    // Account section
    planBilling: 'Plan et Facturation',
    currentPlan: 'Plan Actuel',
    upgradePlan: 'Mettre à Niveau',
    viewUpgradeOptions: 'Voir les Options',
    
    // Notifications section
    browserPushNotifications: 'Notifications Push du Navigateur',
    browserPushDesc: 'Recevez des rappels de renouvellement sur ce navigateur/appareil',
    browserPushNote: 'Pour iPhone/iPad, ajoutez Renewly à votre écran d\'accueil pour activer web push. La configuration de la livraison des notifications est en cours de finalisation.',
    pushNotifications: 'Notifications Push',
    emailNotifications: 'Notifications Email',
    emailNotificationsDesc: 'Résumés hebdomadaires',
    reminderTiming: 'Délai de Rappel',
    reminderTimingDesc: 'jours avant le renouvellement',
    daysBeforeRenewal: 'jours avant',
    
    // Security section
    changePassword: 'Changer le Mot de Passe',
    emailAddress: 'Adresse Email',
    phoneNumber: 'Numéro de Téléphone',
    phoneNotConfigured: 'Ajoutez votre numéro de téléphone',
    biometricLogin: 'Connexion Biométrique',
    biometricDesc: 'Face ID / Touch ID',
    biometricNotSupported: 'Non pris en charge sur cet appareil',
    
    // Password form
    currentPassword: 'Mot de Passe Actuel',
    newPassword: 'Nouveau Mot de Passe',
    confirmNewPassword: 'Confirmer le Nouveau Mot de Passe',
    passwordRules: 'Exigences du Mot de Passe',
    passwordMinLength: 'Au moins 8 caractères',
    passwordUppercase: 'Une lettre majuscule',
    passwordLowercase: 'Une lettre minuscule',
    passwordNumber: 'Un chiffre',
    passwordSpecial: 'Un caractère spécial (!@#$%^&*)',
    passwordsMatch: 'Les mots de passe correspondent',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas',
    wrongCurrentPassword: 'Le mot de passe actuel est incorrect',
    passwordUpdated: 'Mot de passe mis à jour avec succès',
    updatePassword: 'Mettre à Jour le Mot de Passe',
    
    // Phone form
    addPhoneNumber: 'Ajouter un Numéro de Téléphone',
    editPhoneNumber: 'Modifier le Numéro de Téléphone',
    phoneVerified: 'Vérifié',
    phoneUnverified: 'Non vérifié',
    verifyPhone: 'Vérifier le Téléphone',
    verificationNotConfigured: 'La vérification par SMS n\'est pas encore configurée. Votre numéro sera enregistré mais ne pourra pas être vérifié pour le moment.',
    sendVerificationCode: 'Envoyer le Code de Vérification',
    enterVerificationCode: 'Entrez le code de vérification',
    
    // Appearance section
    darkMode: 'Mode Sombre',
    currency: 'Devise',
    language: 'Langue',
    languageUpdated: 'Langue mise à jour',
    currencyUpdated: 'Devise mise à jour',
    
    // Data section
    exportData: 'Exporter les Données',
    exportAsCSV: 'Exporter en CSV',
    exportAsJSON: 'Exporter en JSON',
    fullAccountBackup: 'Sauvegarde complète du compte',
    exportComplete: 'Exportation terminée',
    
    // Support section
    helpCenter: 'Centre d\'Aide',
    termsOfService: 'Conditions d\'Utilisation',
    privacyPolicy: 'Politique de Confidentialité',
    
    // Profile
    editProfile: 'Modifier le Profil',
    fullName: 'Nom Complet',
    saveProfile: 'Enregistrer le Profil',
    profileUpdated: 'Profil mis à jour',
    
    // Sign out
    signOut: 'Déconnexion',
    signingOut: 'Déconnexion en cours...',
    
    // Toasts
    settingsSaved: 'Paramètres enregistrés',
    errorOccurred: 'Une erreur est survenue',
    tryAgain: 'Veuillez réessayer',
  },
  
  de: {
    // Navigation
    dashboard: 'Dashboard',
    calendar: 'Kalender',
    analytics: 'Analytik',
    leakReport: 'Leckagebericht',
    smartInbox: 'Intelligente Inbox',
    integrations: 'Integrationen',
    notifications: 'Benachrichtigungen',
    settings: 'Einstellungen',
    addSubscription: 'Abonnement Hinzufügen',
    more: 'Mehr',
    
    // Dashboard
    financialCommandCenter: 'Finanzkontrollzentrum',
    monthlySpend: 'Monatliche Ausgaben',
    annualProjected: 'Jährliche Projektion',
    potentialSavings: 'Mögliche Ersparnisse',
    subscriptionHealthScore: 'Gesundheitswert',
    needsAttention: 'Erfordert Aufmerksamkeit',
    yourSubscriptions: 'Ihre Abonnements',
    upcomingRenewals: 'Anstehende Verlängerungen',
    viewReport: 'Bericht Anzeigen',
    displayedIn: 'Angezeigt in',
    noSubscriptionsYet: 'Noch keine Abonnements',
    noSubscriptionsMatch: 'Keine Abonnements stimmen überein',
    
    // Common
    save: 'Speichern',
    cancel: 'Abbrechen',
    close: 'Schließen',
    loading: 'Wird geladen...',
    success: 'Erfolg',
    error: 'Fehler',
    confirm: 'Bestätigen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    
    // Settings
    settingsDescription: 'Verwalten Sie Ihr Konto und Ihre Einstellungen',
    account: 'Konto',
    security: 'Sicherheit',
    appearance: 'Erscheinungsbild',
    support: 'Support',
    dataStorage: 'Daten & Speicher',
    
    // Account section
    planBilling: 'Plan & Abrechnung',
    currentPlan: 'Aktueller Plan',
    upgradePlan: 'Plan Upgraden',
    viewUpgradeOptions: 'Upgrade-Optionen Anzeigen',
    
    // Notifications section
    browserPushNotifications: 'Browser-Push-Benachrichtigungen',
    browserPushDesc: 'Erhalten Sie Verlängerungserinnerungen in diesem Browser/Gerät',
    browserPushNote: 'Für iPhone/iPad fügen Sie Renewly zum Startbildschirm hinzu, um Web-Push zu aktivieren. Die Push-Zustellung wird gerade abgeschlossen.',
    pushNotifications: 'Push-Benachrichtigungen',
    emailNotifications: 'E-Mail-Benachrichtigungen',
    emailNotificationsDesc: 'Wöchentliche Zusammenfassungen',
    reminderTiming: 'Erinnerungszeitpunkt',
    reminderTimingDesc: 'Tage vor Verlängerung',
    daysBeforeRenewal: 'Tage vorher',
    
    // Security section
    changePassword: 'Passwort Ändern',
    emailAddress: 'E-Mail-Adresse',
    phoneNumber: 'Telefonnummer',
    phoneNotConfigured: 'Fügen Sie Ihre Telefonnummer hinzu',
    biometricLogin: 'Biometrische Anmeldung',
    biometricDesc: 'Face ID / Touch ID',
    biometricNotSupported: 'Auf diesem Gerät nicht unterstützt',
    
    // Password form
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmNewPassword: 'Neues Passwort Bestätigen',
    passwordRules: 'Passwortanforderungen',
    passwordMinLength: 'Mindestens 8 Zeichen',
    passwordUppercase: 'Ein Großbuchstabe',
    passwordLowercase: 'Ein Kleinbuchstabe',
    passwordNumber: 'Eine Zahl',
    passwordSpecial: 'Ein Sonderzeichen (!@#$%^&*)',
    passwordsMatch: 'Passwörter stimmen überein',
    passwordsDontMatch: 'Passwörter stimmen nicht überein',
    wrongCurrentPassword: 'Aktuelles Passwort ist falsch',
    passwordUpdated: 'Passwort erfolgreich aktualisiert',
    updatePassword: 'Passwort Aktualisieren',
    
    // Phone form
    addPhoneNumber: 'Telefonnummer Hinzufügen',
    editPhoneNumber: 'Telefonnummer Bearbeiten',
    phoneVerified: 'Verifiziert',
    phoneUnverified: 'Nicht verifiziert',
    verifyPhone: 'Telefon Verifizieren',
    verificationNotConfigured: 'SMS-Verifizierung ist noch nicht konfiguriert. Ihre Telefonnummer wird gespeichert, kann aber derzeit nicht verifiziert werden.',
    sendVerificationCode: 'Bestätigungscode Senden',
    enterVerificationCode: 'Bestätigungscode eingeben',
    
    // Appearance section
    darkMode: 'Dunkelmodus',
    currency: 'Währung',
    language: 'Sprache',
    languageUpdated: 'Sprache aktualisiert',
    currencyUpdated: 'Währung aktualisiert',
    
    // Data section
    exportData: 'Daten Exportieren',
    exportAsCSV: 'Als CSV Exportieren',
    exportAsJSON: 'Als JSON Exportieren',
    fullAccountBackup: 'Vollständige Kontosicherung',
    exportComplete: 'Export abgeschlossen',
    
    // Support section
    helpCenter: 'Hilfecenter',
    termsOfService: 'Nutzungsbedingungen',
    privacyPolicy: 'Datenschutzrichtlinie',
    
    // Profile
    editProfile: 'Profil Bearbeiten',
    fullName: 'Vollständiger Name',
    saveProfile: 'Profil Speichern',
    profileUpdated: 'Profil aktualisiert',
    
    // Sign out
    signOut: 'Abmelden',
    signingOut: 'Abmelden...',
    
    // Toasts
    settingsSaved: 'Einstellungen gespeichert',
    errorOccurred: 'Ein Fehler ist aufgetreten',
    tryAgain: 'Bitte versuchen Sie es erneut',
  },
  
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    calendar: 'कैलेंडर',
    analytics: 'विश्लेषण',
    leakReport: 'लीक रिपोर्ट',
    smartInbox: 'स्मार्ट इनबॉक्स',
    integrations: 'एकीकरण',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    addSubscription: 'सदस्यता जोड़ें',
    more: 'अधिक',
    
    // Dashboard
    financialCommandCenter: 'वित्तीय कमांड सेंटर',
    monthlySpend: 'मासिक खर्च',
    annualProjected: 'वार्षिक अनुमान',
    potentialSavings: 'संभावित बचत',
    subscriptionHealthScore: 'स्वास्थ्य स्कोर',
    needsAttention: 'ध्यान देने की जरूरत है',
    yourSubscriptions: 'आपकी सदस्यताएं',
    upcomingRenewals: 'आने वाली नवीनीकरण',
    viewReport: 'रिपोर्ट देखें',
    displayedIn: 'इसमें प्रदर्शित',
    noSubscriptionsYet: 'अभी कोई सदस्यता नहीं',
    noSubscriptionsMatch: 'कोई सदस्यता मेल नहीं खाती',
    
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    success: 'सफल',
    error: 'त्रुटि',
    confirm: 'पुष्टि करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    add: 'जोड़ें',
    
    // Settings
    settingsDescription: 'अपना खाता और प्राथमिकताएं प्रबंधित करें',
    account: 'खाता',
    security: 'सुरक्षा',
    appearance: 'दिखावट',
    support: 'सहायता',
    dataStorage: 'डेटा और स्टोरेज',
    
    // Account section
    planBilling: 'प्लान और बिलिंग',
    currentPlan: 'वर्तमान प्लान',
    upgradePlan: 'प्लान अपग्रेड करें',
    viewUpgradeOptions: 'अपग्रेड विकल्प देखें',
    
    // Notifications section
    browserPushNotifications: 'ब्राउज़र पुश नोटिफिकेशन',
    browserPushDesc: 'इस ब्राउज़र/डिवाइस पर नवीनीकरण रिमाइंडर प्राप्त करें',
    browserPushNote: 'iPhone/iPad के लिए, वेब पुश सक्षम करने के लिए Renewly को अपनी होम स्क्रीन पर जोड़ें। पुश डिलीवरी सेटअप अभी अंतिम रूप दिया जा रहा है।',
    pushNotifications: 'पुश नोटिफिकेशन',
    emailNotifications: 'ईमेल नोटिफिकेशन',
    emailNotificationsDesc: 'साप्ताहिक सारांश',
    reminderTiming: 'रिमाइंडर समय',
    reminderTimingDesc: 'नवीनीकरण से पहले दिन',
    daysBeforeRenewal: 'दिन पहले',
    
    // Security section
    changePassword: 'पासवर्ड बदलें',
    emailAddress: 'ईमेल पता',
    phoneNumber: 'फोन नंबर',
    phoneNotConfigured: 'अपना फोन नंबर जोड़ें',
    biometricLogin: 'बायोमेट्रिक लॉगिन',
    biometricDesc: 'Face ID / Touch ID',
    biometricNotSupported: 'इस डिवाइस पर समर्थित नहीं',
    
    // Password form
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmNewPassword: 'नया पासवर्ड पुष्टि करें',
    passwordRules: 'पासवर्ड आवश्यकताएं',
    passwordMinLength: 'कम से कम 8 अक्षर',
    passwordUppercase: 'एक बड़ा अक्षर',
    passwordLowercase: 'एक छोटा अक्षर',
    passwordNumber: 'एक संख्या',
    passwordSpecial: 'एक विशेष अक्षर (!@#$%^&*)',
    passwordsMatch: 'पासवर्ड मेल खाते हैं',
    passwordsDontMatch: 'पासवर्ड मेल नहीं खाते',
    wrongCurrentPassword: 'वर्तमान पासवर्ड गलत है',
    passwordUpdated: 'पासवर्ड सफलतापूर्वक अपडेट किया गया',
    updatePassword: 'पासवर्ड अपडेट करें',
    
    // Phone form
    addPhoneNumber: 'फोन नंबर जोड़ें',
    editPhoneNumber: 'फोन नंबर संपादित करें',
    phoneVerified: 'सत्यापित',
    phoneUnverified: 'असत्यापित',
    verifyPhone: 'फोन सत्यापित करें',
    verificationNotConfigured: 'SMS सत्यापन अभी तक कॉन्फ़िगर नहीं है। आपका फोन नंबर सहेजा जाएगा लेकिन इस समय सत्यापित नहीं किया जा सकता।',
    sendVerificationCode: 'सत्यापन कोड भेजें',
    enterVerificationCode: 'सत्यापन कोड दर्ज करें',
    
    // Appearance section
    darkMode: 'डार्क मोड',
    currency: 'मुद्रा',
    language: 'भाषा',
    languageUpdated: 'भाषा अपडेट की गई',
    currencyUpdated: 'मुद्रा अपडेट की गई',
    
    // Data section
    exportData: 'डेटा निर्यात करें',
    exportAsCSV: 'CSV के रूप में निर्यात',
    exportAsJSON: 'JSON के रूप में निर्यात',
    fullAccountBackup: 'पूर्ण खाता बैकअप',
    exportComplete: 'निर्यात पूर्ण',
    
    // Support section
    helpCenter: 'सहायता केंद्र',
    termsOfService: 'सेवा की शर्तें',
    privacyPolicy: 'गोपनीयता नीति',
    
    // Profile
    editProfile: 'प्रोफ़ाइल संपादित करें',
    fullName: 'पूरा नाम',
    saveProfile: 'प्रोफ़ाइल सहेजें',
    profileUpdated: 'प्रोफ़ाइल अपडेट की गई',
    
    // Sign out
    signOut: 'साइन आउट',
    signingOut: 'साइन आउट हो रहा है...',
    
    // Toasts
    settingsSaved: 'सेटिंग्स सहेजी गईं',
    errorOccurred: 'एक त्रुटि हुई',
    tryAgain: 'कृपया पुनः प्रयास करें',
  },
}

/**
 * Get translations for a specific language
 */
export function getTranslations(language: string): Translations {
  const lang = (language || 'en') as SupportedLanguage
  return translations[lang] || translations.en
}

/**
 * Hook-compatible translation getter
 */
export function t(key: keyof Translations, language: string = 'en'): string {
  const lang = (language || 'en') as SupportedLanguage
  const trans = translations[lang] || translations.en
  return trans[key] || translations.en[key] || key
}

/**
 * Get all supported languages for UI display
 */
export function getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
  return Object.entries(languageNames).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }))
}
