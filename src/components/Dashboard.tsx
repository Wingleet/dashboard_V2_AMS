import { useState, useEffect } from 'react';
import { 
  Plane, 
  Wrench, 
  Clock, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Hammer,
  TrendingUp,
  ClipboardList,
  Settings,
  Loader2
} from 'lucide-react';
import { WorkPackageData } from '../types/dashboard';
import { fetchWpDetail, WpDetail } from '../api/amsEndpoints';

// Mock data for fallback
const mockData: WorkPackageData = {
  WP_ID: 1234,
  AC_MSN: 852,
  WO_Total: 942,
  WO_Total_Routine: 531,
  WO_Total_RectWorks_Excl: 300,
  WO_Total_AddWOrks: 77,
  WO_Total_RectWorks_Incl: 1,
  WO_Total_Storage: 33,
  WO_Total_Routine_Closed: 531,
  WO_Total_RectWorks_Excl_Closed: 298,
  WO_Total_AddWorks_Closed: 77,
  WO_Total_RectWorks_Incl_Closed: 1,
  WO_Total_Storage_Closed: 33,
  WO_Total_MH_Opened: 5,
  WO_Total_Routine_MH_Opened: 0,
  WO_Total_RectWorks_Excl_MH_Opened: 5,
  WO_Total_AddWorks_MH_Opened: 0,
  WO_Total_RectWorks_Incl_MH_Opened: 0,
  WO_Total_Storage_MH_Opened: 0,
  WO_Total_MH_Closed: 4604.45,
  WO_Total_Routine_MH_Closed: 2248.07,
  WO_Total_RectWorks_Excl_MH_Closed: 1660,
  WO_Total_AddWorks_MH_Closed: 464.18,
  WO_Total_RectWorks_Incl_MH_Closed: 20,
  WO_Total_Storage_MH_Closed: 212.2,
  PARTS_IN_RFQ: 0,
  PARTS_TO_BE_QUOTED: 0,
  PARTS_TO_BE_ORDERED: 0,
  PARTS_TO_BE_ORDERED_POIN: 0,
  PARTS_ETA_PAST: 0,
  PARTS_ETA_ON_TIME: 0,
  PARTS_NO_ETA: 0,
  PARTS_TO_BE_ISSUED: 6,
  PARTS_TO_BE_ISSUED_POIN: 0,
  PARTS_UNDER_CLAIM: 0,
  PARTS_REQ_ETA_PAST: 0,
  PARTS_REQ_ETA_ON_TIME: 16,
  PARTS_REQ_NO_ETA: 0,
  BUYER_CQ_TO_APPROVE: 0,
  TECHOFFICE_CQ_TO_APPROVE: 0,
  CQ_TO_BE_SENT: 2,
  CQ_PENDING_CUST_APPROVAL: 0,
  TOOLS_NOT_RETURNED: 0
};

// Convert API WpDetail to WorkPackageData
function mapWpDetailToData(wpDetail: WpDetail): WorkPackageData {
  return {
    WP_ID: wpDetail.WP_ID,
    AC_MSN: wpDetail.AC_MSN,
    WO_Total: wpDetail.WO_Total,
    WO_Total_Routine: wpDetail.WO_Total_Routine,
    WO_Total_RectWorks_Excl: wpDetail.WO_Total_RectWorks_Excl,
    WO_Total_AddWOrks: wpDetail.WO_Total_AddWOrks,
    WO_Total_RectWorks_Incl: wpDetail.WO_Total_RectWorks_Incl,
    WO_Total_Storage: wpDetail.WO_Total_Storage,
    WO_Total_Routine_Closed: wpDetail.WO_Total_Routine_Closed,
    WO_Total_RectWorks_Excl_Closed: wpDetail.WO_Total_RectWorks_Excl_Closed,
    WO_Total_AddWorks_Closed: wpDetail.WO_Total_AddWorks_Closed,
    WO_Total_RectWorks_Incl_Closed: wpDetail.WO_Total_RectWorks_Incl_Closed,
    WO_Total_Storage_Closed: wpDetail.WO_Total_Storage_Closed,
    WO_Total_MH_Opened: wpDetail.WO_Total_MH_Opened,
    WO_Total_Routine_MH_Opened: wpDetail.WO_Total_Routine_MH_Opened,
    WO_Total_RectWorks_Excl_MH_Opened: wpDetail.WO_Total_RectWorks_Excl_MH_Opened,
    WO_Total_AddWorks_MH_Opened: wpDetail.WO_Total_AddWorks_MH_Opened,
    WO_Total_RectWorks_Incl_MH_Opened: wpDetail.WO_Total_RectWorks_Incl_MH_Opened,
    WO_Total_Storage_MH_Opened: wpDetail.WO_Total_Storage_MH_Opened,
    WO_Total_MH_Closed: wpDetail.WO_Total_MH_Closed,
    WO_Total_Routine_MH_Closed: wpDetail.WO_Total_Routine_MH_Closed,
    WO_Total_RectWorks_Excl_MH_Closed: wpDetail.WO_Total_RectWorks_Excl_MH_Closed,
    WO_Total_AddWorks_MH_Closed: wpDetail.WO_Total_AddWorks_MH_Closed,
    WO_Total_RectWorks_Incl_MH_Closed: wpDetail.WO_Total_RectWorks_Incl_MH_Closed,
    WO_Total_Storage_MH_Closed: wpDetail.WO_Total_Storage_MH_Closed,
    PARTS_IN_RFQ: wpDetail.PARTS_IN_RFQ,
    PARTS_TO_BE_QUOTED: wpDetail.PARTS_TO_BE_QUOTED,
    PARTS_TO_BE_ORDERED: wpDetail.PARTS_TO_BE_ORDERED,
    PARTS_TO_BE_ORDERED_POIN: wpDetail.PARTS_TO_BE_ORDERED_POIN,
    PARTS_ETA_PAST: wpDetail.PARTS_ETA_PAST,
    PARTS_ETA_ON_TIME: wpDetail.PARTS_ETA_ON_TIME,
    PARTS_NO_ETA: wpDetail.PARTS_NO_ETA,
    PARTS_TO_BE_ISSUED: wpDetail.PARTS_TO_BE_ISSUED,
    PARTS_TO_BE_ISSUED_POIN: wpDetail.PARTS_TO_BE_ISSUED_POIN,
    PARTS_UNDER_CLAIM: wpDetail.PARTS_UNDER_CLAIM,
    PARTS_REQ_ETA_PAST: wpDetail.PARTS_REQ_ETA_PAST,
    PARTS_REQ_ETA_ON_TIME: wpDetail.PARTS_REQ_ETA_ON_TIME,
    PARTS_REQ_NO_ETA: wpDetail.PARTS_REQ_NO_ETA,
    BUYER_CQ_TO_APPROVE: wpDetail.BUYER_CQ_TO_APPROVE,
    TECHOFFICE_CQ_TO_APPROVE: wpDetail.TECHOFFICE_CQ_TO_APPROVE,
    CQ_TO_BE_SENT: wpDetail.CQ_TO_BE_SENT,
    CQ_PENDING_CUST_APPROVAL: wpDetail.CQ_PENDING_CUST_APPROVAL,
    TOOLS_NOT_RETURNED: wpDetail.TOOLS_NOT_RETURNED
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

interface ProgressBarProps {
  label: string;
  total: number;
  closed: number;
  color: string;
}

const ProgressBar = ({ label, total, closed, color }: ProgressBarProps) => {
  const percentage = total > 0 ? Math.round((closed / total) * 100) : 0;
  
  return (
    <div className="text-center">
      <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500">{closed}/{total} ({percentage}%)</p>
    </div>
  );
};

interface MHCardProps {
  label: string;
  opened: number;
  closed: number;
  icon: React.ReactNode;
}

const MHCard = ({ label, opened, closed, icon }: MHCardProps) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center">
    <div className="flex items-center justify-center gap-1 mb-2">
      {icon}
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
    <div className="flex justify-center gap-3">
      <div>
        <p className="text-[10px] text-gray-500">Open</p>
        <p className="text-sm font-semibold text-orange-600">{opened.toFixed(1)}h</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500">Closed</p>
        <p className="text-sm font-semibold text-green-600">{closed.toFixed(1)}h</p>
      </div>
    </div>
  </div>
);

interface DashboardProps {
  wpNumber: string;
  acId?: number; // Aircraft ID for API calls
}

const Dashboard = ({ wpNumber, acId = 1 }: DashboardProps) => {
  const [data, setData] = useState<WorkPackageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useApi, setUseApi] = useState(true);

  // Load data when wpNumber changes
  useEffect(() => {
    const loadData = async () => {
      if (!wpNumber) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (useApi) {
          // Try to fetch from API
          const wpId = parseInt(wpNumber);
          if (isNaN(wpId)) {
            throw new Error('Invalid WP number');
          }
          
          const result = await fetchWpDetail(acId, wpId);
          
          if (result.ok && result.data.length > 0) {
            setData(mapWpDetailToData(result.data[0]));
          } else {
            // Fallback to mock data if API fails or returns empty
            console.warn('[Dashboard] API returned no data, using mock data');
            setData({ ...mockData, WP_ID: wpId });
          }
        } else {
          // Use mock data directly
          setData({ ...mockData, WP_ID: parseInt(wpNumber) || mockData.WP_ID });
        }
      } catch (err) {
        console.error('[Dashboard] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fallback to mock data on error
        setData({ ...mockData, WP_ID: parseInt(wpNumber) || mockData.WP_ID });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [wpNumber, acId, useApi]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading WP-{wpNumber}...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h2>
        <p className="text-gray-500">Enter a valid WP number to view the dashboard</p>
      </div>
    );
  }

  const totalWOClosed = data.WO_Total_Routine_Closed + data.WO_Total_RectWorks_Excl_Closed + 
    data.WO_Total_AddWorks_Closed + data.WO_Total_RectWorks_Incl_Closed + data.WO_Total_Storage_Closed;
  
  const completionRate = data.WO_Total > 0 ? Math.round((totalWOClosed / data.WO_Total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            {error} - Showing cached/mock data
          </p>
          <button 
            onClick={() => setUseApi(!useApi)}
            className="ml-auto text-xs text-amber-600 hover:text-amber-800 underline"
          >
            {useApi ? 'Use Mock Data' : 'Try API Again'}
          </button>
        </div>
      )}

      {/* Aircraft & Work Package Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Plane className="w-8 h-8" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Work Package</p>
              <p className="text-3xl font-bold">WP-{data.WP_ID}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-blue-100 text-sm">MSN</p>
              <p className="text-2xl font-bold">{data.AC_MSN}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm">Progress</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm">Total WO</p>
              <p className="text-2xl font-bold">{data.WO_Total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Work Orders"
          value={data.WO_Total}
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          color="text-blue-600"
          subtitle={`${totalWOClosed} closed`}
        />
        <StatCard
          title="Open Man Hours"
          value={`${data.WO_Total_MH_Opened.toFixed(1)}h`}
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          color="text-orange-600"
        />
        <StatCard
          title="Closed Man Hours"
          value={`${data.WO_Total_MH_Closed.toFixed(1)}h`}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="text-green-600"
        />
        <StatCard
          title="Parts To Be Issued"
          value={data.PARTS_TO_BE_ISSUED}
          icon={<Package className="w-5 h-5 text-purple-600" />}
          color="text-purple-600"
        />
      </div>

      {/* Work Orders Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Work Orders Progress</h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-5 gap-3">
          <ProgressBar 
            label="Routine" 
            total={data.WO_Total_Routine} 
            closed={data.WO_Total_Routine_Closed}
            color="bg-blue-500"
          />
          <ProgressBar 
            label="Rect. (Excl.)" 
            total={data.WO_Total_RectWorks_Excl} 
            closed={data.WO_Total_RectWorks_Excl_Closed}
            color="bg-green-500"
          />
          <ProgressBar 
            label="Add. Works" 
            total={data.WO_Total_AddWOrks} 
            closed={data.WO_Total_AddWorks_Closed}
            color="bg-purple-500"
          />
          <ProgressBar 
            label="Rect. (Incl.)" 
            total={data.WO_Total_RectWorks_Incl} 
            closed={data.WO_Total_RectWorks_Incl_Closed}
            color="bg-indigo-500"
          />
          <ProgressBar 
            label="Storage" 
            total={data.WO_Total_Storage} 
            closed={data.WO_Total_Storage_Closed}
            color="bg-amber-500"
          />
        </div>
      </div>

      {/* Man Hours Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Man Hours</h2>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <MHCard 
            label="Routine" 
            opened={data.WO_Total_Routine_MH_Opened}
            closed={data.WO_Total_Routine_MH_Closed}
            icon={<Settings className="w-3 h-3 text-blue-500" />}
          />
          <MHCard 
            label="Rect. (Excl.)" 
            opened={data.WO_Total_RectWorks_Excl_MH_Opened}
            closed={data.WO_Total_RectWorks_Excl_MH_Closed}
            icon={<Wrench className="w-3 h-3 text-green-500" />}
          />
          <MHCard 
            label="Add. Works" 
            opened={data.WO_Total_AddWorks_MH_Opened}
            closed={data.WO_Total_AddWorks_MH_Closed}
            icon={<TrendingUp className="w-3 h-3 text-purple-500" />}
          />
          <MHCard 
            label="Rect. (Incl.)" 
            opened={data.WO_Total_RectWorks_Incl_MH_Opened}
            closed={data.WO_Total_RectWorks_Incl_MH_Closed}
            icon={<Wrench className="w-3 h-3 text-indigo-500" />}
          />
          <MHCard 
            label="Storage" 
            opened={data.WO_Total_Storage_MH_Opened}
            closed={data.WO_Total_Storage_MH_Closed}
            icon={<Package className="w-3 h-3 text-amber-500" />}
          />
        </div>
      </div>

      {/* Parts, Customer Queries & Tools - Compact Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Parts Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Parts Status</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-blue-600 font-medium">In RFQ</p>
              <p className="text-lg font-bold text-blue-700">{data.PARTS_IN_RFQ}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-purple-600 font-medium">To Quote</p>
              <p className="text-lg font-bold text-purple-700">{data.PARTS_TO_BE_QUOTED}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-orange-600 font-medium">To Order</p>
              <p className="text-lg font-bold text-orange-700">{data.PARTS_TO_BE_ORDERED}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-green-600 font-medium">To Issue</p>
              <p className="text-lg font-bold text-green-700">{data.PARTS_TO_BE_ISSUED}</p>
            </div>
          </div>
          
          <div className="border-t pt-2">
            <p className="text-xs font-medium text-gray-600 mb-2 text-center">ETA Status</p>
            <div className="grid grid-cols-3 gap-1">
              <div className={`text-center p-1.5 rounded ${data.PARTS_ETA_PAST > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_ETA_PAST > 0 ? 'text-red-600' : 'text-gray-500'}`}>Past Due</p>
                <p className={`text-sm font-bold ${data.PARTS_ETA_PAST > 0 ? 'text-red-700' : 'text-gray-400'}`}>{data.PARTS_ETA_PAST}</p>
              </div>
              <div className={`text-center p-1.5 rounded ${data.PARTS_ETA_ON_TIME > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_ETA_ON_TIME > 0 ? 'text-green-600' : 'text-gray-500'}`}>On Time</p>
                <p className={`text-sm font-bold ${data.PARTS_ETA_ON_TIME > 0 ? 'text-green-700' : 'text-gray-400'}`}>{data.PARTS_ETA_ON_TIME}</p>
              </div>
              <div className={`text-center p-1.5 rounded ${data.PARTS_NO_ETA > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_NO_ETA > 0 ? 'text-amber-600' : 'text-gray-500'}`}>No ETA</p>
                <p className={`text-sm font-bold ${data.PARTS_NO_ETA > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{data.PARTS_NO_ETA}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-2 mt-2">
            <p className="text-xs font-medium text-gray-600 mb-2 text-center">ETA Requests</p>
            <div className="grid grid-cols-3 gap-1">
              <div className={`text-center p-1.5 rounded ${data.PARTS_REQ_ETA_PAST > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_REQ_ETA_PAST > 0 ? 'text-red-600' : 'text-gray-500'}`}>Past Due</p>
                <p className={`text-sm font-bold ${data.PARTS_REQ_ETA_PAST > 0 ? 'text-red-700' : 'text-gray-400'}`}>{data.PARTS_REQ_ETA_PAST}</p>
              </div>
              <div className={`text-center p-1.5 rounded ${data.PARTS_REQ_ETA_ON_TIME > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_REQ_ETA_ON_TIME > 0 ? 'text-green-600' : 'text-gray-500'}`}>On Time</p>
                <p className={`text-sm font-bold ${data.PARTS_REQ_ETA_ON_TIME > 0 ? 'text-green-700' : 'text-gray-400'}`}>{data.PARTS_REQ_ETA_ON_TIME}</p>
              </div>
              <div className={`text-center p-1.5 rounded ${data.PARTS_REQ_NO_ETA > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <p className={`text-[10px] ${data.PARTS_REQ_NO_ETA > 0 ? 'text-amber-600' : 'text-gray-500'}`}>No ETA</p>
                <p className={`text-sm font-bold ${data.PARTS_REQ_NO_ETA > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{data.PARTS_REQ_NO_ETA}</p>
              </div>
            </div>
          </div>

          {data.PARTS_UNDER_CLAIM > 0 && (
            <div className="bg-red-50 border border-red-200 rounded mt-2 p-2 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">Under Claim: {data.PARTS_UNDER_CLAIM}</span>
            </div>
          )}
        </div>

        {/* Customer Queries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Customer Queries</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-amber-600 font-medium">Buyer Approval</p>
              <p className="text-xl font-bold text-amber-700">{data.BUYER_CQ_TO_APPROVE}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-indigo-600 font-medium">Tech Office</p>
              <p className="text-xl font-bold text-indigo-700">{data.TECHOFFICE_CQ_TO_APPROVE}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-blue-600 font-medium">To Be Sent</p>
              <p className="text-xl font-bold text-blue-700">{data.CQ_TO_BE_SENT}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-purple-600 font-medium">Pending Cust.</p>
              <p className="text-xl font-bold text-purple-700">{data.CQ_PENDING_CUST_APPROVAL}</p>
            </div>
          </div>
        </div>

        {/* Tools Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Hammer className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Tools</h2>
          </div>
          <div className={`rounded-lg p-4 text-center ${data.TOOLS_NOT_RETURNED > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            {data.TOOLS_NOT_RETURNED > 0 ? (
              <>
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-red-600 font-medium">Not Returned</p>
                <p className="text-2xl font-bold text-red-700">{data.TOOLS_NOT_RETURNED}</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-600 font-medium">All Returned</p>
                <p className="text-2xl font-bold text-green-700">✓</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
