
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { fetchAllStatuses, MainStatus, SubStatus } from '@/services/statusService';
import { toast } from 'sonner';

interface StatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  value, 
  onChange,
  className
}) => {
  const [statuses, setStatuses] = useState<MainStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubStatus, setSelectedSubStatus] = useState<SubStatus | null>(null);
  const [selectedMainStatus, setSelectedMainStatus] = useState<MainStatus | null>(null);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const data = await fetchAllStatuses();
        setStatuses(data);
        
        // Find the current selected status
        let found = false;
        for (const main of data) {
          if (main.subStatuses) {
            const sub = main.subStatuses.find(s => s.id === value);
            if (sub) {
              setSelectedSubStatus(sub);
              setSelectedMainStatus(main);
              found = true;
              break;
            }
          }
        }
        
        if (!found && value) {
          console.warn(`Status with ID ${value} not found`);
        }
      } catch (error) {
        console.error('Error loading statuses:', error);
        toast.error('Failed to load statuses');
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, [value]);

  const handleStatusChange = (newValue: string) => {
    // Find the selected sub-status
    for (const main of statuses) {
      if (main.subStatuses) {
        const sub = main.subStatuses.find(s => s.id === newValue);
        if (sub) {
          setSelectedSubStatus(sub);
          setSelectedMainStatus(main);
          break;
        }
      }
    }
    
    onChange(newValue);
  };

  const getStatusStyle = () => {
    if (selectedSubStatus?.color) {
      return {
        backgroundColor: `${selectedSubStatus.color}20`, // 20% opacity
        borderColor: selectedSubStatus.color,
        color: selectedSubStatus.color
      };
    }
    
    if (selectedMainStatus?.color) {
      return {
        backgroundColor: `${selectedMainStatus.color}20`, // 20% opacity
        borderColor: selectedMainStatus.color,
        color: selectedMainStatus.color
      };
    }
    
    return {};
  };

  if (loading) {
    return (
      <div className="h-9 bg-gray-100 rounded-md animate-pulse"></div>
    );
  }

  return (
    <Select value={value} onValueChange={handleStatusChange}>
      <SelectTrigger 
        className={className} 
        style={getStatusStyle()}
      >
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent className="w-[200px]">
        {statuses.map((mainStatus) => (
          <SelectGroup key={mainStatus.id}>
            <SelectLabel 
              className="flex items-center gap-2 py-1.5"
              style={{ color: mainStatus.color || undefined }}
            >
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: mainStatus.color || '#777777' }}
              />
              {mainStatus.name}
            </SelectLabel>
            
            {mainStatus.subStatuses?.map((subStatus) => (
              <SelectItem 
                key={subStatus.id} 
                value={subStatus.id}
                className="pl-7"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-sm" 
                    style={{ backgroundColor: subStatus.color || mainStatus.color || '#777777' }}
                  />
                  <span>{subStatus.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};
