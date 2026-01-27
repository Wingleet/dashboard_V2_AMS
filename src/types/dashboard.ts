// Types for dashboard data

export interface WorkPackageData {
  WP_ID: number;
  AC_MSN: number;
  
  // Work Orders Totals
  WO_Total: number;
  WO_Total_Routine: number;
  WO_Total_RectWorks_Excl: number;
  WO_Total_AddWOrks: number;
  WO_Total_RectWorks_Incl: number;
  WO_Total_Storage: number;
  
  // Work Orders Closed
  WO_Total_Routine_Closed: number;
  WO_Total_RectWorks_Excl_Closed: number;
  WO_Total_AddWorks_Closed: number;
  WO_Total_RectWorks_Incl_Closed: number;
  WO_Total_Storage_Closed: number;
  
  // Man Hours Opened
  WO_Total_MH_Opened: number;
  WO_Total_Routine_MH_Opened: number;
  WO_Total_RectWorks_Excl_MH_Opened: number;
  WO_Total_AddWorks_MH_Opened: number;
  WO_Total_RectWorks_Incl_MH_Opened: number;
  WO_Total_Storage_MH_Opened: number;
  
  // Man Hours Closed
  WO_Total_MH_Closed: number;
  WO_Total_Routine_MH_Closed: number;
  WO_Total_RectWorks_Excl_MH_Closed: number;
  WO_Total_AddWorks_MH_Closed: number;
  WO_Total_RectWorks_Incl_MH_Closed: number;
  WO_Total_Storage_MH_Closed: number;
  
  // Parts Status
  PARTS_IN_RFQ: number;
  PARTS_TO_BE_QUOTED: number;
  PARTS_TO_BE_ORDERED: number;
  PARTS_TO_BE_ORDERED_POIN: number;
  PARTS_ETA_PAST: number;
  PARTS_ETA_ON_TIME: number;
  PARTS_NO_ETA: number;
  PARTS_TO_BE_ISSUED: number;
  PARTS_TO_BE_ISSUED_POIN: number;
  PARTS_UNDER_CLAIM: number;
  PARTS_REQ_ETA_PAST: number;
  PARTS_REQ_ETA_ON_TIME: number;
  PARTS_REQ_NO_ETA: number;
  
  // Approvals & Customer Queries
  BUYER_CQ_TO_APPROVE: number;
  TECHOFFICE_CQ_TO_APPROVE: number;
  CQ_TO_BE_SENT: number;
  CQ_PENDING_CUST_APPROVAL: number;
  
  // Tools
  TOOLS_NOT_RETURNED: number;
}

export interface DashboardStats {
  workPackage: WorkPackageData;
  lastUpdated: Date;
}
