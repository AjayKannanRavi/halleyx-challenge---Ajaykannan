import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Play, Bell, User } from 'lucide-react';
import { clsx } from 'clsx';

const BaseNode = ({ 
  data, 
  icon: Icon, 
  title, 
  className,
  status = 'pending' 
}: { 
  data: any; 
  icon: any; 
  title: string; 
  className?: string;
  status?: string;
}) => {
  const statusColors = {
    completed: 'border-green-500 bg-green-500/10',
    in_progress: 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    failed: 'border-red-500 bg-red-500/10',
    pending: 'border-white/10 bg-white/5'
  };

  return (
    <div className={clsx(
      'px-4 py-3 rounded-xl border-2 transition-all duration-300 min-w-[200px]',
      statusColors[status as keyof typeof statusColors] || statusColors.pending,
      className
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary border-2 border-surface" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{title}</div>
          <div className="text-sm font-semibold text-white/90 truncate">{data.label}</div>
        </div>
      </div>

      {data.metadata && (
        <div className="text-[10px] text-white/30 bg-black/20 rounded p-1.5 mt-2 font-mono truncate">
          {typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)}
        </div>
      )}

      {status === 'in_progress' && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary border-2 border-surface" />
    </div>
  );
};

export const TaskNode = memo((props: NodeProps) => (
  <BaseNode {...props} title="Task Step" icon={Play} />
));

export const ApprovalNode = memo((props: NodeProps) => (
  <BaseNode {...props} title="Approval Step" icon={User} className="border-indigo-500/50" />
));

export const NotificationNode = memo((props: NodeProps) => (
  <BaseNode {...props} title="Notification" icon={Bell} className="border-pink-500/50" />
));

TaskNode.displayName = 'TaskNode';
ApprovalNode.displayName = 'ApprovalNode';
NotificationNode.displayName = 'NotificationNode';
