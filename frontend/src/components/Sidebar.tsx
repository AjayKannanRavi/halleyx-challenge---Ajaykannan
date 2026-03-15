import { Layout, Activity, BarChart2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeScreen: string;
  setScreen: (screen: string) => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ activeScreen, setScreen, isCollapsed, setCollapsed }: SidebarProps) => {
  const menuItems = [
    { id: 'list', label: 'Workflows', icon: Layout },
    { id: 'history', label: 'Execution History', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className={clsx(
      'h-full bg-surface border-r border-white/5 flex flex-col transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-white">HALLEY<span className="text-primary">X</span></span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
              activeScreen === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            )}
          >
            <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110', activeScreen === item.id ? 'text-white' : 'text-primary')} />
            {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all group">
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span className="text-sm font-semibold">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
