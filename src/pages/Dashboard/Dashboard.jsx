import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, MessageCircle, CheckCircle, TrendingUp,
  Clock, PhoneCall, Activity, IndianRupee, MapPin, 
  FileText, XCircle, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { token } = useAuth();
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newLeadsToday: 0,
    pendingQuotations: 0,
    activeQueries: 0,
    lostDeals: 0,
    conversionRate: 0,
    destinations: [],
    activities: [],
  });

  const [followUps, setFollowUps] = useState({
    overdue: [],
    today: [],
    upcoming: []
  });

  const [activeFollowUpTab, setActiveFollowUpTab] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

  // Parse Date string without time safely
  const getDateOnly = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.split('T')[0];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/crm/leads', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          const leads = data.data || [];
          const todayDate = new Date().toISOString().split('T')[0];

          // 1. Calculate KPI Metrics
          let totalRevenue = 0;
          let newLeadsToday = 0;
          let pendingQuotations = 0;
          let activeQueries = 0;
          let wonDeals = 0;
          let lostDeals = 0;
          
          const destCount = {};
          const activitiesRaw = [];

          leads.forEach(l => {
            // New Leads Today
            if (l.type === 'LEAD' && getDateOnly(l.createdAt) === todayDate) {
              newLeadsToday++;
            }
            
            // Pending Quotations
            if (l.status === 'QUOTATION_SENT' || l.status === 'NEGOTIATION') {
              pendingQuotations++;
            }

            // Active Queries
            if (l.type === 'QUERY' && l.status !== 'WON' && l.status !== 'LOST') {
              activeQueries++;
            }

            // Won & Revenue
            if (l.status === 'WON') {
              wonDeals++;
              // Simulating revenue from budget for now if real revenue isn't tracked
              const budget = parseInt(l.budget?.replace(/[^0-9]/g, '')) || 0;
              totalRevenue += (budget || 50000); // fallback 50k if no budget
            }

            // Lost
            if (l.status === 'LOST') {
              lostDeals++;
            }

            // Destinations mapping
            if (l.destination) {
              destCount[l.destination] = (destCount[l.destination] || 0) + 1;
            }

            // Activity timeline mock based on createdAt
            activitiesRaw.push({
              id: `act_${l.id}_created`,
              title: `New lead added: ${l.name}`,
              desc: `Destination: ${l.destination || 'Not specified'}`,
              date: new Date(l.createdAt),
              type: 'lead'
            });

            // Activity timeline mock for WON status
            if (l.status === 'WON') {
              activitiesRaw.push({
                id: `act_${l.id}_won`,
                title: `Deal Won: ${l.name}`,
                desc: `Revenue added to pipeline`,
                date: new Date(l.updatedAt || l.createdAt),
                type: 'won'
              });
            }
          });

          // Calculations
          const totalQueries = activeQueries + wonDeals + lostDeals;
          const conversionRate = totalQueries > 0 ? Math.round((wonDeals / totalQueries) * 100) : 0;

          // Destination formatting (Top 4)
          const destinations = Object.entries(destCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

          // Follow-ups Categorization
          const overdue = [];
          const todayList = [];
          const upcoming = [];

          leads.forEach(l => {
            // Find the next incomplete task for follow up
            const nextTask = l.tasks?.filter(t => !t.isCompleted).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
            const next_followup = nextTask ? nextTask.dueDate : null;

            if (next_followup && l.status !== 'WON' && l.status !== 'LOST') {
              const fDate = getDateOnly(next_followup);
              if (fDate < todayDate) overdue.push(l);
              else if (fDate === todayDate) todayList.push(l);
              else upcoming.push(l);
            }
          });

          setFollowUps({
            overdue: overdue.sort((a, b) => new Date(a.next_followup) - new Date(b.next_followup)),
            today: todayList,
            upcoming: upcoming.sort((a, b) => new Date(a.next_followup) - new Date(b.next_followup))
          });

          setStats({
            totalRevenue,
            newLeadsToday,
            pendingQuotations,
            activeQueries,
            lostDeals,
            conversionRate,
            destinations,
            activities: activitiesRaw.sort((a, b) => b.date - a.date).slice(0, 8)
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  // Format currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, subtitle }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColorClass} ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</div>
        <div className="text-xl font-bold text-slate-800 leading-none">{isLoading ? '-' : value}</div>
        {subtitle && <div className="text-[9px] text-slate-400 mt-1 font-medium">{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* 6-Grid KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(stats.totalRevenue)} 
          icon={IndianRupee} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" 
        />
        <StatCard 
          title="New Leads Today" 
          value={stats.newLeadsToday} 
          icon={Users} colorClass="text-blue-600" bgColorClass="bg-blue-50" 
        />
        <StatCard 
          title="Pending Quotes" 
          value={stats.pendingQuotations} 
          icon={FileText} colorClass="text-purple-600" bgColorClass="bg-purple-50" 
        />
        <StatCard 
          title="Active Queries" 
          value={stats.activeQueries} 
          icon={MessageCircle} colorClass="text-amber-600" bgColorClass="bg-amber-50" 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate}%`} 
          icon={TrendingUp} colorClass="text-indigo-600" bgColorClass="bg-indigo-50" 
        />
        <StatCard 
          title="Lost Deals" 
          value={stats.lostDeals} 
          icon={XCircle} colorClass="text-red-600" bgColorClass="bg-red-50" 
        />
      </div>

      {/* Main Grid: Charts, Destinations, Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        
        {/* Left Column (Spans 8) - Chart & Destinations */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Revenue Chart Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col flex-1 min-h-[260px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800">Revenue Performance</h3>
              <select className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 outline-none text-slate-600">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-2 px-2 mt-auto">
              {/* Dummy Data for Chart */}
              {[
                { label: 'Jan', val: 30 }, { label: 'Feb', val: 45 }, { label: 'Mar', val: 60 },
                { label: 'Apr', val: 50 }, { label: 'May', val: 85 }, { label: 'Jun', val: 70 },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group justify-end">
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-sm relative flex items-end overflow-hidden min-h-[140px]">
                    <div 
                      className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000 ease-out group-hover:bg-blue-600"
                      style={{ height: `${isLoading ? 0 : bar.val}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Analytics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-rose-500" />
              Top Destinations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isLoading ? (
                <div className="col-span-4 text-xs text-slate-400 text-center py-4">Loading stats...</div>
              ) : stats.destinations.length === 0 ? (
                <div className="col-span-4 text-xs text-slate-400 text-center py-4">No destination data yet.</div>
              ) : (
                stats.destinations.map((dest, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 truncate" title={dest.name}>
                      {dest.name}
                    </div>
                    <div className="text-lg font-black text-slate-800">{dest.count} <span className="text-[9px] text-slate-400 font-normal">Queries</span></div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Spans 4) - Categorized Follow-ups */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[410px]">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <PhoneCall size={16} className="text-amber-500" />
              Follow-ups
            </h3>
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['overdue', 'today', 'upcoming'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveFollowUpTab(tab)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md capitalize transition-colors ${
                    activeFollowUpTab === tab 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab} ({followUps[tab]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading...</div>
            ) : followUps[activeFollowUpTab].length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                <CheckCircle size={32} className="mb-2" />
                <p className="text-[10px] font-medium">No {activeFollowUpTab} follow-ups!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {followUps[activeFollowUpTab].map(lead => (
                  <div key={lead.id} className="flex gap-2.5 items-center p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{lead.name}</h4>
                      <p className="text-[9px] text-slate-500 truncate">{lead.destination || 'General'}</p>
                    </div>
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      activeFollowUpTab === 'overdue' ? 'bg-red-50 text-red-600' :
                      activeFollowUpTab === 'today' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {getDateOnly(lead.next_followup)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Activity size={16} className="text-blue-500" />
          Recent Activities
        </h3>
        
        {isLoading ? (
          <div className="text-xs text-slate-400">Loading activities...</div>
        ) : stats.activities.length === 0 ? (
          <div className="text-xs text-slate-400">No recent activity.</div>
        ) : (
          <div className="relative pl-3 border-l-2 border-slate-100 space-y-4">
            {stats.activities.map((act) => (
              <div key={act.id} className="relative pl-4">
                {/* Timeline dot */}
                <div className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  act.type === 'won' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {act.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
