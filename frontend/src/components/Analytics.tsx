import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Workflow
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface StatsData {
  totalExecutions: number;
  activeWorkflows: number;
  statusDistribution: Record<string, number>;
  recentActivity: Array<{ started_at: string; status: string }>;
}

const Analytics = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/executions/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.totalExecutions > 0 
    ? Math.round(((stats.statusDistribution.completed || 0) / stats.totalExecutions) * 100)
    : 0;

  // Process chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const chartData = last7Days.map(day => {
    const count = stats.recentActivity.filter(ex => 
      isSameDay(new Date(ex.started_at), day)
    ).length;
    return {
      date: format(day, 'MMM dd'),
      count
    };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Analytics</h1>
          <p className="text-white/40 mt-1 font-medium italic">Real-time performance metrics and execution trends.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60">
          <Clock size={14} className="text-primary" />
          Last 7 Days
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Executions" 
          value={stats.totalExecutions} 
          icon={Activity} 
          color="primary"
          trend="+12%"
        />
        <KPICard 
          title="Active Workflows" 
          value={stats.activeWorkflows} 
          icon={Workflow} 
          color="secondary"
          trend="Stable"
        />
        <KPICard 
          title="Success Rate" 
          value={`${successRate}%`} 
          icon={CheckCircle2} 
          color="emerald"
          trend="+5%"
        />
        <KPICard 
          title="Failed Tasks" 
          value={stats.statusDistribution.failed || 0} 
          icon={XCircle} 
          color="rose"
          trend="-2%"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <BarChart2 size={20} className="text-primary" />
            Execution Activity
          </h3>

          <div className="h-64 flex items-end justify-between gap-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                <div className="w-full relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / maxCount) * 100}%` }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 50 }}
                    className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-xl group-hover/bar:from-primary/40 group-hover/bar:to-primary transition-all relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                  </motion.div>
                  {d.count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {d.count}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <Activity size={20} className="text-secondary" />
            Status Health
          </h3>
          
          <div className="space-y-6">
            <StatusRow label="Completed" count={stats.statusDistribution.completed} total={stats.totalExecutions} color="bg-emerald-500" />
            <StatusRow label="In Progress" count={stats.statusDistribution.in_progress} total={stats.totalExecutions} color="bg-primary" />
            <StatusRow label="Failed" count={stats.statusDistribution.failed} total={stats.totalExecutions} color="bg-rose-500" />
            <StatusRow label="Canceled" count={stats.statusDistribution.canceled} total={stats.totalExecutions} color="bg-white/20" />
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Total Load</div>
            <div className="text-2xl font-black text-white">{stats.totalExecutions.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-500 font-bold mt-1">System operational</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="bg-surface border border-white/5 rounded-3xl p-6 shadow-xl hover:border-white/10 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{trend}</div>
      </div>
      <div>
        <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-1">{title}</div>
        <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, count = 0, total, color }: any) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-white/60">{label}</span>
        <span className="text-white">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

export default Analytics;
