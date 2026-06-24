export type Lang = "en" | "sw";

export type DashboardDict = {
  nav: {
    overview: string;
    deliveries: string;
    drivers: string;
    fleetMap: string;
    reports: string;
    driverPortal: string;
    settings: string;
    system: string;
    portals: string;
  };
  topbar: {
    titleFallback: string;
  };
  stats: {
    totalDeliveries: string;
    deliveredToday: string;
    active: string;
    activeSub: string;
    pendingAssignment: string;
    needDriver: string;
    allAssigned: string;
    revenueMonth: string;
    revenueSub: string;
  };
  deliveries: {
    title: string;
    subtitle: string;
    viewAll: string;
    loading: string;
    refresh: string;
    newDelivery: string;
    searchCode: string;
    allStatuses: string;
    createDialog: {
      title: string;
      subtitle: string;
      sender: string;
      recipient: string;
      route: string;
      fullName: string;
      pickupAddress: string;
      deliveryAddress: string;
      addressPlaceholder: string;
      useCurrentLocation: string;
      city: string;
      priority: { label: string; low: string; normal: string; high: string; urgent: string };
      fee: string;
      optional: string;
      notes: string;
      notesPlaceholder: string;
      cancel: string;
      createBtn: string;
      creating: string;
    };
    stats: {
      total: string;
      allDeliveries: string;
      onTheRoad: string;
      assignedInTransit: string;
      pending: string;
      awaitingAssignment: string;
      deliveredToday: string;
      completedToday: string;
    };
    statuses: {
      PENDING: string;
      ASSIGNED: string;
      PICKED_UP: string;
      IN_TRANSIT: string;
      DELIVERED: string;
      FAILED: string;
      CANCELLED: string;
    };
    filter: string;
    clear: string;
  };
  drivers: {
    search: string;
    addDriver: string;
    emptyTitle: string;
    emptyDesc: string;
    createFirst: string;
    filterEmpty: string;
    clearSearch: string;
    stats: {
      total: string;
      onTheRoad: string;
      available: string;
      invitePending: string;
    };
    card: {
      active: string;
      done: string;
      total: string;
      inviteLink: string;
      copyLink: string;
      copied: string;
      whatsapp: string;
      whatsappMsg: string;
      unnamed: string;
    };
    addDialog: {
      title: string;
      subtitle: string;
      fullName: string;
      namePlaceholder: string;
      phone: string;
      email: string;
      emailPlaceholder: string;
      cancel: string;
      addBtn: string;
    };
  };
  map: {
    fleetLive: string;
    live: string;
    stale: string;
    noGps: string;
    noActive: string;
    noActiveDesc: string;
    ago: string;
    fitAll: string;
    drivers: string;
    legend: string;
    liveDesc: string;
    staleDesc: string;
    offlineDesc: string;
    status: string;
    assigned: string;
    pickedUp: string;
    inTransit: string;
    activeDeliveries: string;
    activeDelivery: string;
    search: string;
    noMatch: string;
    loadingMap: string;
    loadingData: string;
  };
  reports: {
    totalDeliveries: string;
    delivered: string;
    active: string;
    revenueMonth: string;
    byStatus: string;
    realisedRevenue: string;
    drivers: string;
    export: string;
    exportDesc: string;
    downloadCsv: string;
  };
  settings: {
    teamMembers: string;
    deliveries: string;
    memberSince: string;
    orgProfile: string;
    orgProfileDesc: string;
    adminOnly: string;
    orgName: string;
    phone: string;
    city: string;
    address: string;
    country: string;
    saving: string;
    saveChanges: string;
    peopleHaveAccess: string;
    personHasAccess: string;
    dangerZone: string;
    dangerZoneDesc: string;
    irreversible: string;
    resetData: string;
    typeToConfirm: string;
    cancel: string;
    deleteEverything: string;
    deleting: string;
    unnamed: string;
  };
  driverPortal: {
    toPickup: string;
    onTheRoad: string;
    doneToday: string;
    adminMode: string;
    adminModeDesc: string;
    noActive: string;
    noActiveDriverDesc: string;
    noActiveAdminDesc: string;
    activeDeliveries: string;
    details: {
      call: string;
      whatsapp: string;
      navigate: string;
      reportIssue: string;
      issueModal: {
        title: string;
        subtitle: string;
        reason: string;
        reasonPlaceholder: string;
        reasons: {
          customerUnreachable: string;
          wrongAddress: string;
          vehicleBreakdown: string;
          other: string;
        };
        notes: string;
        notesPlaceholder: string;
        cancel: string;
        submit: string;
        submitting: string;
      };
        podModal: {
          title: string;
          subtitle: string;
          receivedBy: string;
          receivedByPlaceholder: string;
          receivedByHint: string;
          photo: string;
          photoGood: string;
          package: string;
          recipient: string;
          location: string;
          takePhoto: string;
          takePhotoHint: string;
          retake: string;
          remove: string;
          compressing: string;
          photoReady: string;
          signature: string;
          notes: string;
          notesPlaceholder: string;
          optional: string;
          saving: string;
          stepUploading: string;
          stepSaving: string;
          waitWarning: string;
          uploadFailed: string;
          cancel: string;
          markDelivered: string;
          processingPhoto: string;
          retry: string;
          successTitle: string;
          successDesc: string;
          closingAuto: string;
          cashToCollect: string;
          cashHint: string;
        };
      };
  };
  dashboard: {
    bannerTitle: string;
    bannerSubtitle: string;
    emptyTitle: string;
    emptyDesc: string;
    createFirst: string;
    filterEmptyTitle: string;
    filterEmptyDesc: string;
    clearFilters: string;
    errorTitle: string;
    tryAgain: string;
    setupTitle: string;
    setupDesc: string;
    completeSetup: string;
    pageOf: string;
    deliveryCount: string;
    loading: string;
    refresh: string;
    newDelivery: string;
  };
  banners: {
    deliveries: { title: string; subtitle: string };
    drivers: { title: string; subtitle: string };
    reports: { title: string; subtitle: string };
    settings: { title: string; subtitle: string };
    driverPortal: { title: string; subtitleDefault: string; subtitleName: string };
  };
  table: {
    tracking: string;
    recipient: string;
    address: string;
    status: string;
    driver: string;
    fee: string;
    date: string;
    viewDetails: string;
    copyLink: string;
    assignDriver: string;
    linkCopied: string;
  };
};

export const dashboardTranslations: Record<Lang, DashboardDict> = {
  en: {
    nav: {
      overview: "Overview",
      deliveries: "Deliveries",
      drivers: "Drivers",
      fleetMap: "Fleet Map",
      reports: "Reports",
      driverPortal: "Driver Portal",
      settings: "Settings",
      system: "System",
      portals: "Portals",
    },
    topbar: {
      titleFallback: "Dashboard",
    },
    stats: {
      totalDeliveries: "Total Deliveries",
      deliveredToday: "delivered today",
      active: "Active",
      activeSub: "Assigned, picked up, in transit",
      pendingAssignment: "Pending Assignment",
      needDriver: "Need a driver",
      allAssigned: "All assigned",
      revenueMonth: "Revenue This Month",
      revenueSub: "Sum of delivery fees",
    },
    deliveries: {
      title: "Deliveries",
      subtitle: "Manage and track all your deliveries",
      viewAll: "View all",
      loading: "Loading…",
      refresh: "Refresh",
      newDelivery: "New Delivery",
      searchCode: "Tracking code...",
      allStatuses: "All statuses",
      createDialog: {
        title: "New Delivery",
        subtitle: "Fields marked * are required",
        sender: "SENDER",
        recipient: "RECIPIENT",
        route: "DELIVERY ROUTE",
        fullName: "Full name *",
        pickupAddress: "Pickup address *",
        deliveryAddress: "Delivery address *",
        addressPlaceholder: "Type an area, street or landmark — pick a suggestion.",
        useCurrentLocation: "Use my current location",
        city: "City",
        priority: { label: "Priority", low: "Low", normal: "Normal", high: "High", urgent: "Urgent" },
        fee: "Delivery Fee",
        optional: "(optional)",
        notes: "Notes",
        notesPlaceholder: "Special instructions for the driver — fragile items, gate codes, etc.",
        cancel: "Cancel",
        createBtn: "Create Delivery",
        creating: "Creating…",
      },
      stats: {
        total: "TOTAL",
        allDeliveries: "All deliveries",
        onTheRoad: "ON THE ROAD",
        assignedInTransit: "Assigned - in transit",
        pending: "PENDING",
        awaitingAssignment: "Awaiting assignment",
        deliveredToday: "DELIVERED TODAY",
        completedToday: "Completed today",
      },
      statuses: {
        PENDING: "Pending",
        ASSIGNED: "Assigned",
        PICKED_UP: "Picked Up",
        IN_TRANSIT: "In Transit",
        DELIVERED: "Delivered",
        FAILED: "Failed",
        CANCELLED: "Cancelled",
      },
      filter: "Filter",
      clear: "Clear",
    },
    drivers: {
      search: "Search drivers...",
      addDriver: "Add Driver",
      emptyTitle: "No drivers yet",
      emptyDesc: "Add your first driver so you can assign deliveries and track them on the fleet map.",
      createFirst: "Add First Driver",
      filterEmpty: "No drivers match",
      clearSearch: "Clear search",
      stats: {
        total: "TOTAL DRIVERS",
        onTheRoad: "ON THE ROAD",
        available: "AVAILABLE",
        invitePending: "INVITE PENDING",
      },
      card: {
        active: "ACTIVE",
        done: "DONE",
        total: "TOTAL",
        inviteLink: "Invite link",
        copyLink: "Copy link",
        copied: "Copied",
        whatsapp: "WhatsApp",
        whatsappMsg: "Hi {name}, you have been invited to be a CourierFlow driver. Click here to join: {link}",
        unnamed: "Unnamed driver",
      },
      addDialog: {
        title: "Add Driver",
        subtitle: "We'll text them an invite link — they sign up and they're in.",
        fullName: "FULL NAME",
        namePlaceholder: "e.g. Juma Hassan",
        phone: "PHONE",
        email: "EMAIL",
        emailPlaceholder: "driver@example.com",
        cancel: "Cancel",
        addBtn: "Add Driver",
      },
    },
    map: {
      fleetLive: "Fleet Live",
      live: "live",
      stale: "stale",
      noGps: "no GPS",
      noActive: "No active deliveries",
      noActiveDesc: "Drivers will appear here once a delivery is on the road.",
      ago: "ago",
      fitAll: "Fit all",
      drivers: "Drivers",
      legend: "Legend",
      liveDesc: "Live · < 1 min",
      staleDesc: "Stale · 1–5 min",
      offlineDesc: "Offline · > 5 min",
      status: "Status",
      assigned: "Assigned",
      pickedUp: "Picked Up",
      inTransit: "In Transit",
      activeDeliveries: "Active Deliveries",
      activeDelivery: "Active Delivery",
      search: "Search driver, code, city…",
      noMatch: "No drivers match",
      loadingMap: "Loading map…",
      loadingData: "Loading fleet data…",
    },
    reports: {
      totalDeliveries: "Total deliveries",
      delivered: "Delivered",
      active: "Active",
      revenueMonth: "Revenue (month)",
      byStatus: "Deliveries by status",
      realisedRevenue: "Realised revenue (delivered)",
      drivers: "drivers",
      export: "Export deliveries",
      exportDesc: "Download all deliveries as a CSV (opens in Excel / Google Sheets).",
      downloadCsv: "Download CSV",
    },
    settings: {
      teamMembers: "Team Members",
      deliveries: "Deliveries",
      memberSince: "Member Since",
      orgProfile: "Organization Profile",
      orgProfileDesc: "This information appears on tracking pages and SMS alerts to customers.",
      adminOnly: "Only organization admins can edit these settings.",
      orgName: "Organization name",
      phone: "Phone (for SOS alerts)",
      city: "City",
      address: "Address",
      country: "Country",
      saving: "Saving…",
      saveChanges: "Save Changes",
      peopleHaveAccess: "people have access to this organization.",
      personHasAccess: "person has access to this organization.",
      dangerZone: "Danger Zone",
      dangerZoneDesc: "Permanently delete all deliveries, drivers, payments, GPS tracking, proof of delivery and SMS logs for this organisation. Your account and organisation stay — only the operational data is cleared so you can start fresh.",
      irreversible: "Irreversible — proceed with care",
      resetData: "Reset all data",
      typeToConfirm: "Type",
      cancel: "Cancel",
      deleteEverything: "Delete everything",
      deleting: "Deleting…",
      unnamed: "Unnamed",
    },
    driverPortal: {
      toPickup: "To pick up",
      onTheRoad: "On the road",
      doneToday: "Done today",
      adminMode: "Admin mode:",
      adminModeDesc: "showing all active org deliveries. Open any delivery below to simulate GPS tracking from a driver's perspective.",
      noActive: "No active deliveries",
      noActiveDriverDesc: "Your assigned deliveries will appear here.",
      noActiveAdminDesc: "No deliveries with status Assigned, Picked Up, or In Transit.",
      activeDeliveries: "Active Deliveries",
      details: {
        call: "Call",
        whatsapp: "WhatsApp",
        navigate: "Navigate",
        reportIssue: "Report an Issue",
        issueModal: {
          title: "Report Issue",
          subtitle: "Mark this delivery as failed with a reason.",
          reason: "REASON",
          reasonPlaceholder: "Select a reason...",
          reasons: {
            customerUnreachable: "Customer not reachable",
            wrongAddress: "Wrong or incomplete address",
            vehicleBreakdown: "Vehicle breakdown / Accident",
            other: "Other (specify below)",
          },
          notes: "ADDITIONAL NOTES",
          notesPlaceholder: "Provide more details about the issue...",
          cancel: "Cancel",
          submit: "Report Issue",
          submitting: "Submitting...",
        },
        podModal: {
          title: "Confirm Delivery",
          subtitle: "Fill in the details to complete",
          receivedBy: "Received by",
          receivedByPlaceholder: "Full name of person who received",
          receivedByHint: "Required to complete the delivery",
          photo: "Delivery photo",
          photoGood: "Good proof photo should show:",
          package: "Package",
          recipient: "Recipient",
          location: "Location",
          takePhoto: "Take Photo",
          takePhotoHint: "Camera or gallery · auto-compressed",
          retake: "Retake",
          remove: "Remove",
          compressing: "Compressing…",
          photoReady: "Photo ready",
          signature: "Recipient signature",
          notes: "Notes",
          notesPlaceholder: "e.g. Left at front door, given to security guard…",
          optional: "optional",
          saving: "Saving proof…",
          stepUploading: "Uploading files to server",
          stepSaving: "Saving delivery record",
          waitWarning: "Please wait — do not close this window",
          uploadFailed: "Upload failed",
          cancel: "Cancel",
          markDelivered: "Mark as Delivered",
          processingPhoto: "Processing photo…",
          retry: "Retry",
          successTitle: "Delivery Confirmed!",
          successDesc: "Proof of delivery saved successfully",
          closingAuto: "Closing automatically…",
          cashToCollect: "CASH TO COLLECT",
          cashHint: "Collect this amount before handing over the package.",
        },
      },
    },
    dashboard: {
      bannerTitle: "Overview",
      bannerSubtitle: "Your delivery operation at a glance — deliveries, drivers and revenue.",
      emptyTitle: "No deliveries yet",
      emptyDesc: "Create your first delivery to start tracking packages across Tanzania.",
      createFirst: "Create First Delivery",
      filterEmptyTitle: "No deliveries match your filters",
      filterEmptyDesc: "Try adjusting or clearing your search",
      clearFilters: "Clear Filters",
      errorTitle: "Something went wrong",
      tryAgain: "Try Again",
      setupTitle: "Account not set up",
      setupDesc: "Your account is not linked to an organization yet. Click below to complete setup.",
      completeSetup: "Complete Setup",
      pageOf: "Page {page} of {pages}",
      deliveryCount: "{total} deliveries",
      loading: "Loading…",
      refresh: "Refresh",
      newDelivery: "New Delivery",
    },
    banners: {
      deliveries: { title: "Deliveries", subtitle: "Create, manage and track all deliveries" },
      drivers: { title: "Drivers", subtitle: "Manage your delivery team and track their workload" },
      reports: { title: "Reports", subtitle: "Delivery performance, revenue and exports for your organisation" },
      settings: { title: "Settings", subtitle: "Manage your organization profile and team" },
      driverPortal: { title: "Driver Portal", subtitleDefault: "Your active deliveries", subtitleName: "Welcome back, {name}" },
    },
    table: {
      tracking: "Tracking",
      recipient: "Recipient",
      address: "Address",
      status: "Status",
      driver: "Driver",
      fee: "Fee",
      date: "Date",
      viewDetails: "View details",
      copyLink: "Copy tracking link",
      assignDriver: "Assign driver",
      linkCopied: "Tracking link copied!",
    },
  },
  sw: {
    nav: {
      overview: "Muhtasari",
      deliveries: "Uwasilishaji",
      drivers: "Madereva",
      fleetMap: "Ramani ya Fleet",
      reports: "Ripoti",
      driverPortal: "Portal ya Dereva",
      settings: "Mipangilio",
      system: "Mfumo",
      portals: "Ziada",
    },
    topbar: {
      titleFallback: "Dashibodi",
    },
    stats: {
      totalDeliveries: "Jumla ya Vifurushi",
      deliveredToday: "vimewasilishwa leo",
      active: "Njiani",
      activeSub: "Vimepangwa, vimechukuliwa",
      pendingAssignment: "Inasubiri Dereva",
      needDriver: "Inahitaji dereva",
      allAssigned: "Vyote vimepangwa",
      revenueMonth: "Mapato Mwezi Huu",
      revenueSub: "Jumla ya ada za usafiri",
    },
    deliveries: {
      title: "Uwasilishaji",
      subtitle: "Simamia na fuatilia vifurushi vyako vyote",
      viewAll: "Ona vyote",
      loading: "Inapakia…",
      refresh: "Onyesha Upya",
      newDelivery: "Kifurushi Kipya",
      searchCode: "Namba ya kifurushi...",
      allStatuses: "Hali zote",
      createDialog: {
        title: "Kifurushi Kipya",
        subtitle: "Sehemu zenye * ni lazima kujaza",
        sender: "MTUMAJI",
        recipient: "MPOKEAJI",
        route: "NJIA YA UWASILISHAJI",
        fullName: "Jina kamili *",
        pickupAddress: "Mahali pa kuchukua *",
        deliveryAddress: "Mahali pa kupeleka *",
        addressPlaceholder: "Andika eneo, mtaa au alama - chagua pendekezo.",
        useCurrentLocation: "Tumia eneo langu la sasa",
        city: "Mji",
        priority: { label: "Kipaumbele", low: "Chini", normal: "Kawaida", high: "Juu", urgent: "Haraka" },
        fee: "Ada ya Uwasilishaji",
        optional: "(sio lazima)",
        notes: "Maelezo Ziada",
        notesPlaceholder: "Maelekezo maalum kwa dereva — vitu vinavyovunjika, nenosiri la geti, n.k.",
        cancel: "Ghairi",
        createBtn: "Tengeneza Kifurushi",
        creating: "Inatengeneza…",
      },
      stats: {
        total: "JUMLA",
        allDeliveries: "Vifurushi vyote",
        onTheRoad: "NJIANI",
        assignedInTransit: "Vimepewa dereva - njiani",
        pending: "INASUBIRI",
        awaitingAssignment: "Vinasubiri dereva",
        deliveredToday: "VIMEFIKA LEO",
        completedToday: "Vimekamilika leo",
      },
      statuses: {
        PENDING: "Inasubiri",
        ASSIGNED: "Imepangwa",
        PICKED_UP: "Imechukuliwa",
        IN_TRANSIT: "Njiani",
        DELIVERED: "Imefika",
        FAILED: "Imeshindwa",
        CANCELLED: "Imesitishwa",
      },
      filter: "Chuio",
      clear: "Futa",
    },
    drivers: {
      search: "Tafuta madereva...",
      addDriver: "Ongeza Dereva",
      emptyTitle: "Hakuna madereva bado",
      emptyDesc: "Ongeza dereva wako wa kwanza ili uweze kumpangia vifurushi na kumfuatilia.",
      createFirst: "Ongeza Dereva wa Kwanza",
      filterEmpty: "Hakuna dereva anayeendana na",
      clearSearch: "Futa utafutaji",
      stats: {
        total: "JUMLA YA MADEREVA",
        onTheRoad: "NJIANI",
        available: "WAPO TAYARI",
        invitePending: "MUALIKO UNASUBIRI",
      },
      card: {
        active: "ZINAZOENDELEA",
        done: "ZILIZOISHA",
        total: "JUMLA",
        inviteLink: "Kiungo cha Mualiko",
        copyLink: "Nakili kiungo",
        copied: "Kimenakiliwa",
        whatsapp: "WhatsApp",
        whatsappMsg: "Habari {name}, umealikwa kuwa dereva CourierFlow. Fungua hii kujiunga: {link}",
        unnamed: "Dereva asiye na jina",
      },
      addDialog: {
        title: "Ongeza Dereva",
        subtitle: "Tutamtumia kiungo cha mualiko — akijisajili anakuwa ndani.",
        fullName: "JINA KAMILI",
        namePlaceholder: "mf. Juma Hassan",
        phone: "NAMBA YA SIMU",
        email: "BARUA PEPE (EMAIL)",
        emailPlaceholder: "dereva@mfano.com",
        cancel: "Ghairi",
        addBtn: "Ongeza Dereva",
      },
    },
    map: {
      fleetLive: "Ramani ya Moja kwa Moja",
      live: "hewani",
      stale: "zimepitwa",
      noGps: "hakuna GPS",
      noActive: "Hakuna vifurushi njiani",
      noActiveDesc: "Madereva wataonekana hapa pindi kifurushi kikiwa njiani.",
      ago: "iliyopita",
      fitAll: "Onyesha wote",
      drivers: "Madereva",
      legend: "Mwongozo",
      liveDesc: "Moja kwa Moja · < dak 1",
      staleDesc: "Iliyopitwa · dak 1–5",
      offlineDesc: "Nje ya Mtandao · > dak 5",
      status: "Hali",
      assigned: "Imepangiwa",
      pickedUp: "Imechukuliwa",
      inTransit: "Njiani",
      activeDeliveries: "Vifurushi Vinavyosafirishwa",
      activeDelivery: "Kifurushi Kinachosafirishwa",
      search: "Tafuta dereva, namba, mji…",
      noMatch: "Hakuna dereva anayeendana",
      loadingMap: "Inapakia ramani…",
      loadingData: "Inapakia data za ramani…",
    },
    reports: {
      totalDeliveries: "Jumla ya Vifurushi",
      delivered: "Vimefika",
      active: "Njiani",
      revenueMonth: "Mapato (Mwezi)",
      byStatus: "Vifurushi kwa Hali (Status)",
      realisedRevenue: "Mapato halisi yaliyopatikana",
      drivers: "madereva",
      export: "Pakua Ripoti (Export)",
      exportDesc: "Pakua taarifa zote za vifurushi kwenye mfumo wa CSV (inafunguka kwa Excel).",
      downloadCsv: "Pakua CSV",
    },
    settings: {
      teamMembers: "Wafanyakazi",
      deliveries: "Vifurushi",
      memberSince: "Mwanachama tangu",
      orgProfile: "Taarifa za Shirika",
      orgProfileDesc: "Taarifa hizi zitaonekana kwenye kurasa za kufuatilia vifurushi na SMS kwa wateja.",
      adminOnly: "Ni admin tu anayeweza kubadilisha taarifa hizi.",
      orgName: "Jina la shirika",
      phone: "Namba ya Simu (ya SOS)",
      city: "Mji / Jiji",
      address: "Anwani (Mtaa, n.k.)",
      country: "Nchi",
      saving: "Inahifadhi…",
      saveChanges: "Hifadhi Taarifa",
      peopleHaveAccess: "watu wana uwezo wa kuona taarifa za shirika hili.",
      personHasAccess: "mtu ana uwezo wa kuona taarifa za shirika hili.",
      dangerZone: "Eneo la Hatari (Danger Zone)",
      dangerZoneDesc: "Futa kabisa vifurushi vyote, madereva, malipo, GPS, uthibitisho na SMS. Akaunti yako itabaki salama lakini data za uendeshaji zitafutwa ili uanze upya.",
      irreversible: "Hairudishiki nyuma — kuwa makini",
      resetData: "Futa data zote",
      typeToConfirm: "Andika",
      cancel: "Ghairi",
      deleteEverything: "Futa kila kitu",
      deleting: "Inafuta…",
      unnamed: "Hana Jina",
    },
    driverPortal: {
      toPickup: "Kuchukuliwa",
      onTheRoad: "Njiani",
      doneToday: "Kamilika leo",
      adminMode: "Hali ya Admin:",
      adminModeDesc: "inaonyesha vifurushi vyote. Fungua kifurushi chochote chini kuona mfumo wa GPS kutoka upande wa dereva.",
      noActive: "Hakuna vifurushi vinavyosafirishwa",
      noActiveDriverDesc: "Vifurushi vyako ulivyopangiwa vitaonekana hapa.",
      noActiveAdminDesc: "Hakuna vifurushi vyenye hali ya Imepangwa, Imechukuliwa, au Njiani.",
      activeDeliveries: "Vifurushi Vinavyosafirishwa",
      details: {
        call: "Piga Simu",
        whatsapp: "WhatsApp",
        navigate: "Ramani",
        reportIssue: "Ripoti Tatizo",
        issueModal: {
          title: "Ripoti Tatizo",
          subtitle: "Ripoti kama mzigo umeshindikana kufikishwa.",
          reason: "SABABU",
          reasonPlaceholder: "Chagua sababu...",
          reasons: {
            customerUnreachable: "Mteja hapatikani kwenye simu",
            wrongAddress: "Anwani si sahihi / Haieleweki",
            vehicleBreakdown: "Chombo kimeharibika / Ajali",
            other: "Nyingine (Fafanua hapa chini)",
          },
          notes: "MAELEZO YA ZIADA",
          notesPlaceholder: "Toa ufafanuzi zaidi kuhusu tatizo...",
          cancel: "Ghairi",
          submit: "Tuma Ripoti",
          submitting: "Inatuma...",
        },
        podModal: {
          title: "Thibitisha Mzigo Kufika",
          subtitle: "Jaza taarifa kukamilisha",
          receivedBy: "Amepokelewa na",
          receivedByPlaceholder: "Jina kamili la aliyepokea",
          receivedByHint: "Ni lazima kujaza ili kukamilisha",
          photo: "Picha ya mzigo",
          photoGood: "Picha nzuri inapaswa kuonyesha:",
          package: "Kifurushi",
          recipient: "Mpokeaji",
          location: "Eneo",
          takePhoto: "Piga Picha",
          takePhotoHint: "Kamera au nyumba ya picha · itapunguzwa ukubwa",
          retake: "Piga Tena",
          remove: "Ondoa",
          compressing: "Inapunguza ukubwa…",
          photoReady: "Picha ipo tayari",
          signature: "Sahihi ya mpokeaji",
          notes: "Maelezo",
          notesPlaceholder: "mf. Nimeacha getini, nimempa mlinzi…",
          optional: "sio lazima",
          saving: "Inahifadhi kithibitisho…",
          stepUploading: "Inatuma picha na sahihi kwenye mfumo",
          stepSaving: "Inahifadhi rekodi ya mzigo",
          waitWarning: "Tafadhali subiri — usifunge dirisha hili",
          uploadFailed: "Imeshindikana kutuma",
          cancel: "Ghairi",
          markDelivered: "Kamilisha Kufika",
          processingPhoto: "Inashughulikia picha…",
          retry: "Jaribu Tena",
          successTitle: "Mzigo Umethibitishwa!",
          successDesc: "Kithibitisho cha mzigo kimehifadhiwa kikamilifu",
          closingAuto: "Inajifunga yenyewe…",
          cashToCollect: "PESA YA KUKUSANYA (CASH)",
          cashHint: "Kusanya kiasi hiki cha pesa kabla ya kutoa mzigo.",
        },
      },
    },
    dashboard: {
      bannerTitle: "Muhtasari",
      bannerSubtitle: "Angalia usambazaji wako kwa ufupi — vifurushi, madereva na mapato.",
      emptyTitle: "Hakuna vifurushi bado",
      emptyDesc: "Tengeneza kifurushi chako cha kwanza kuanza kufuatilia.",
      createFirst: "Tengeneza Kifurushi",
      filterEmptyTitle: "Hakuna kinachoendana na utafutaji",
      filterEmptyDesc: "Jaribu kubadilisha au kufuta utafutaji wako",
      clearFilters: "Futa Utafutaji",
      errorTitle: "Kuna tatizo limetokea",
      tryAgain: "Jaribu Tena",
      setupTitle: "Akaunti haijakamilika",
      setupDesc: "Akaunti yako haijaunganishwa na shirika lolote bado. Bofya hapa chini kukamilisha.",
      completeSetup: "Kamilisha Usajili",
      pageOf: "Ukurasa {page} wa {pages}",
      deliveryCount: "Vifurushi {total}",
      loading: "Inapakia…",
      refresh: "Onyesha Upya",
      newDelivery: "Kifurushi Kipya",
    },

    banners: {
      deliveries: { title: "Vifurushi", subtitle: "Tengeneza, simamia na fuatilia vifurushi vyote" },
      drivers: { title: "Madereva", subtitle: "Simamia timu yako ya madereva na kazi zao" },
      reports: { title: "Ripoti", subtitle: "Utendaji wa uwasilishaji, mapato na ripoti kwa shirika lako" },
      settings: { title: "Mipangilio", subtitle: "Simamia wasifu wa shirika na timu yako" },
      driverPortal: { title: "Portal ya Dereva", subtitleDefault: "Vifurushi vyako vilivyo njiani", subtitleName: "Karibu tena, {name}" },
    },
    table: {
      tracking: "Kifuatiliaji",
      recipient: "Mpokeaji",
      address: "Anwani",
      status: "Hali",
      driver: "Dereva",
      fee: "Ada",
      date: "Tarehe",
      viewDetails: "Ona maelezo",
      copyLink: "Nakili kiungo",
      assignDriver: "Panga dereva",
      linkCopied: "Kiungo kimenakiliwa!",
    },
  },
};
