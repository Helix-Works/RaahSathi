type DeepStringShape<T> = {
  [Key in keyof T]: T[Key] extends string
    ? string
    : DeepStringShape<T[Key]>;
};

export const enMessages = {
  common: {
    continue: "Continue",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    retry: "Try again",
    comingSoon: "Coming soon",
    logIn: "Log in",
    exploreServices: "Explore services",
    learnMore: "See how it helps",
  },
  navigation: {
    home: "Home",
    services: "Services",
    applications: "Applications",
    dashboard: "Dashboard",
    primaryLabel: "Primary navigation",
    mobileLabel: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to main content",
  },
  language: {
    label: "Choose language",
    english: "English",
    hindi: "हिंदी",
  },
  status: {
    loading: "Loading",
    saved: "Saved",
    unavailable: "Unavailable",
    upcoming: "Journey setup in progress",
  },
  validation: {
    required: "This field is required.",
    invalid: "Check this value and try again.",
  },
  errors: {
    requestFailed: "We could not complete that request.",
    network: "Check your connection and try again.",
    invalidResponse: "The service returned an unexpected response.",
    servicesTitle: "Services are temporarily unavailable",
    servicesDescription:
      "Your progress is safe. Please try loading the service list again.",
    correlationLabel: "Reference ID",
  },
  disclosure: {
    title: "Independent prototype",
    description:
      "RaahSathi is an independent hackathon prototype. It uses synthetic data and is not an official government service.",
  },
  landing: {
    name: "RaahSathi",
    eyebrow: "A clearer Delhi licence journey",
    title: "Know where you stand—and what comes next.",
    tagline:
      "A calm, reliable way to navigate digital driving-licence services, recover after interruptions, and understand every next step.",
    heroNote:
      "Built for transparent status, durable progress, and honest appointment availability.",
    prototypeNotice: "Hackathon prototype using synthetic data.",
    independenceNotice: "Not an official government service.",
    primaryActionsLabel: "Licence service actions",
    applyTitle: "Start a licence application",
    applyDescription:
      "Choose a supported learner or permanent driving-licence journey.",
    applyAction: "View available services",
    resumeTitle: "Resume saved work",
    resumeDescription:
      "Return to an application whose progress has already been saved.",
    resumeAction: "Open your applications",
    checkStatusTitle: "Check status and next action",
    checkStatusDescription:
      "See what is complete, what needs attention, and what to do next.",
    checkStatusAction: "Open your dashboard",
    benefitsTitle: "Reliability you can understand",
    benefitsDescription:
      "RaahSathi is designed around the questions citizens need answered at every step.",
    recoveryTitle: "Resume without starting over",
    recoveryDescription:
      "Saved progress is designed to survive refreshes, sign-outs, and interrupted sessions.",
    statusTitle: "See status and the next action",
    statusDescription:
      "Clear explanations show what is complete, what is blocked, and what to do next.",
    appointmentsTitle: "Understand appointment availability",
    appointmentsDescription:
      "Dates and time slots explain whether capacity is full, unreleased, or temporarily unavailable.",
    languageTitle: "English and Hindi throughout",
    languageDescription:
      "Switch languages without leaving your current page or losing context.",
    nextTitle: "Start with the service that fits your journey",
    nextDescription:
      "Review the two core licence journeys prepared for this prototype before application flows are connected.",
  },
  services: {
    eyebrow: "Driving-licence services",
    title: "Choose the journey you need",
    description:
      "Start or resume one of the two durable synthetic application journeys.",
    learnerName: "New Learner Licence",
    learnerDescription:
      "Prepare for a first learner-licence application with clear progress and recovery.",
    permanentName: "Permanent Driving Licence",
    permanentDescription:
      "Continue from learner eligibility toward the permanent driving-licence journey.",
    unavailableAction: "Application journey coming soon",
    emptyTitle: "No services are available yet",
    emptyDescription:
      "The service catalogue is being prepared. Please check again later.",
    loading: "Loading driving-licence services",
    availableStatus: "Available in this prototype",
    startFailed: "Unable to start safely. Please try again.",
  },
  account: {
    label: "Synthetic citizen account",
    logout: "Log out",
    loggingOut: "Logging out",
    logoutFailed: "We could not log you out. Please try again.",
  },
  auth: {
    eyebrow: "Secure synthetic sign-in",
    title: "Continue with a one-time password",
    description:
      "Use the synthetic mobile and OTP flow to enter the RaahSathi prototype. No real SMS is sent.",
    syntheticNotice:
      "Demo only: enter synthetic details. Do not enter your real mobile number or any government identifier.",
    requestTitle: "Request a synthetic OTP",
    mobileLabel: "Synthetic mobile number",
    mobilePlaceholder: "10-digit synthetic number",
    mobileHelp: "Use 9000000000 for the standard demo or 9000000002 to demonstrate provider unavailability.",
    requestOtp: "Send synthetic OTP",
    requestingOtp: "Sending OTP",
    sentTitle: "Synthetic OTP sent",
    sentDescription: "A simulated OTP challenge is ready for {destination}.",
    otpLabel: "One-time password",
    otpPlaceholder: "Enter 6 digits",
    otpHelp: "Use 123456 for the standard successful demo.",
    resendOtp: "Send a new synthetic OTP",
    resendAvailableIn: "Resend available in {seconds}s",
    verifyOtp: "Verify and continue",
    verifyingOtp: "Verifying OTP",
    changeMobile: "Use a different synthetic number",
    requiredMobile: "Enter a synthetic mobile number.",
    invalidMobile: "Enter a valid 10-digit Indian mobile-number shape.",
    requiredOtp: "Enter the synthetic OTP.",
    invalidOtpFormat: "Enter exactly 6 digits.",
    invalidOtp: "That synthetic OTP is not valid. Check it and try again.",
    expiredOtp: "That synthetic OTP has expired. Request a new one.",
    attemptsExhausted:
      "Too many verification attempts were made. Request a new synthetic OTP.",
    rateLimited: "Too many requests were made. Please wait before trying again.",
    providerUnavailable:
      "The simulated OTP provider is temporarily unavailable. Your progress is safe; try again later.",
    genericFailure: "We could not complete sign-in. Please try again safely.",
    errorSummaryTitle: "Sign-in needs your attention",
    sessionExpiredTitle: "Your session has ended",
    sessionExpiredDescription:
      "Sign in again to see private dashboard information. No consequential action was replayed.",
    reauthenticate: "Sign in again",
  },
  dashboard: {
    eyebrow: "Citizen dashboard",
    title: "Your next step, at a glance",
    greeting: "Welcome back",
    syntheticCitizen: "Synthetic citizen",
    description:
      "See your current work, explicit status, and the next action supplied by the service.",
    activeApplicationTitle: "Active application",
    currentWorkDescription:
      "This status is reconstructed from your saved PostgreSQL application sections.",
    serviceLabel: "Service",
    progressLabel: "Application progress",
    updatedLabel: "Last updated",
    statusAppointmentRequired: "Appointment required",
    statusAppointmentBooked: "Appointment booked",
    statusDraft: "Draft",
    statusInProgress: "In progress",
    statusReadyForIdentity: "Ready for identity verification",
    statusReadyForPayment: "Ready for payment",
    statusUnknown: "Status unavailable",
    nextActionReviewOffer: "Review temporary slot offer",
    nextActionNone: "No action needed right now",
    nextActionResumeApplication: "Resume the next application section",
    nextActionVerifyIdentity: "Complete synthetic identity verification",
    nextActionPayFees: "Review fees and continue to payment",
    nextActionUnknown: "Check again for the next action",
    nextActionDescription:
      "This next action is supplied directly by the dashboard summary; RaahSathi does not infer it in the browser. Selecting it opens the application and identity recovery flow.",
    blockingTitle: "Why you cannot continue yet",
    blockingNoSuitableSlot:
      "No suitable appointment slot was available. Review the temporary offer shown below.",
    blockingIdentityRequired: "Complete synthetic identity verification. Your application progress is saved.",
    blockingPaymentRequired: "Identity is verified. The simulated payment phase is the next required step.",
    blockingUnknown:
      "Continuation is currently unavailable. Check again later or contact support with the reference details shown.",
    noApplicationTitle: "No active application",
    noApplicationDescription:
      "This synthetic account has no work in progress. Explore services when you are ready to begin.",
    supportTitle: "Items that may need attention",
    offerTitle: "Temporary slot offer",
    offerStatus: "Review required",
    offerDescription: "A synthetic slot is being held at {rto} until {time}.",
    appointmentTitle: "Upcoming appointment",
    appointmentStatus: "Confirmed",
    appointmentDescription: "Synthetic appointment at {rto} on {time}.",
    rtoNames: {
      SYNTHETIC_ROHINI: "Synthetic Rohini RTO",
    },
    licenceTitle: "Synthetic licence context",
    licenceDescription: "Learner context · Vehicle class {vehicleClass}",
    vehicleClassNames: {
      LMV: "Light Motor Vehicle (LMV)",
    },
    dataUnavailableTitle: "Dashboard information is unavailable",
    dataUnavailableDescription:
      "Try again later. Private information is not kept on screen when the dashboard service cannot return a safe response.",
  },
  footer: {
    tagline: "Clear status. Safe progress. Honest next steps.",
  },
} as const;

export type MessageDictionary = DeepStringShape<typeof enMessages>;
