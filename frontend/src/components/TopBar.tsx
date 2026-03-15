import { useState } from 'react';
import { Bell, Search, User, Keyboard } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ShortcutModal from './ShortcutModal';

const TopBar = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  return (
    <div className="h-16 border-b border-white/5 bg-surface px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search workflows, executions..." 
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/30 focus:bg-white/10 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/20 font-mono">
            <span className="text-[14px]">⌘</span>K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 hover:bg-white/5 rounded-xl cursor-pointer text-white/40 hover:text-white transition-all relative"
          >
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
          </div>
          <div 
            onClick={() => setIsShortcutOpen(true)}
            className="p-2 hover:bg-white/5 rounded-xl cursor-pointer text-white/40 hover:text-white transition-all"
          >
            <Keyboard size={20} />
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right">
            <div className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">Senior Engineer</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Pro Account</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px]">
            <div className="w-full h-full rounded-[11px] bg-surface flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
      
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ShortcutModal isOpen={isShortcutOpen} onClose={() => setIsShortcutOpen(false)} />
    </div>
  );
};

export default TopBar;
