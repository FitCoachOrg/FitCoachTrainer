"use client"
import React, { useMemo, useState } from 'react';
import { format, parseISO, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Check, X, Calendar, CalendarDays } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type WeekDay = {
  date: string;
  focus: string;
  exercises: any[];
};

interface WeeklyPlanHeaderProps {
  week: WeekDay[];
  planStartDate: Date;
  onReorder: (updatedWeek: WeekDay[]) => void;
  onPlanChange: (updatedWeek: WeekDay[]) => void;
  onMonthlyChange?: (updatedMonthlyData: WeekDay[][]) => void;
}

type ViewMode = 'weekly' | 'monthly';

function SortableHeaderBox({ id, children, disabled = false }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(disabled ? {} : listeners)}>
      {children}
    </div>
  );
}

export default function WeeklyPlanHeader({ week, planStartDate, onReorder, onPlanChange, onMonthlyChange }: WeeklyPlanHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [copySourceDate, setCopySourceDate] = useState<string | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState<string | null>(null);
  const [localMonthlyData, setLocalMonthlyData] = useState<WeekDay[][]>([]);

  // Generate monthly data (4 weeks) from the current week data
  const monthlyData = useMemo(() => {
    if (viewMode === 'weekly') return [week || []];
    
    // If we have local monthly data, use it
    if (localMonthlyData.length > 0) {
      return localMonthlyData;
    }
    
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStartDate = addWeeks(planStartDate, i);
      const weekDays = [];
      
      for (let j = 0; j < 7; j++) {
        const dayDate = new Date(weekStartDate.getTime() + j * 24 * 60 * 60 * 1000);
        const dateStr = dayDate.toISOString().slice(0, 10);
        
        // If this is the first week, use the actual data, otherwise create placeholder data
        if (i === 0) {
          weekDays.push(week[j] || { date: dateStr, focus: 'Rest Day', exercises: [] });
        } else {
          weekDays.push({ date: dateStr, focus: 'Rest Day', exercises: [] });
        }
      }
      weeks.push(weekDays);
    }
    return weeks;
  }, [week, planStartDate, viewMode, localMonthlyData]);

  const days = useMemo(() => week || [], [week]);

  // Create a flat array of all days for monthly operations
  const allDays = useMemo(() => {
    if (viewMode === 'weekly') return days;
    return monthlyData.flat();
  }, [viewMode, days, monthlyData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Parse week and day indices from the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    if (viewMode === 'weekly') {
      const activeIndex = parseInt(activeId.replace('hdr-', ''), 10);
      const overIndex = parseInt(overId.replace('hdr-', ''), 10);
      const reordered = arrayMove(days, activeIndex, overIndex);
      const updated = reordered.map((day, idx) => {
        const newDate = new Date(planStartDate.getTime() + idx * 24 * 60 * 60 * 1000);
        const newDateStr = newDate.toISOString().slice(0, 10);
        return { ...day, date: newDateStr };
      });
      onReorder(updated);
    } else {
      // For monthly view, we'll handle drag and drop within the same week for now
      // This could be expanded to allow cross-week dragging
      const activeMatch = activeId.match(/hdr-(\d+)-(\d+)/);
      const overMatch = overId.match(/hdr-(\d+)-(\d+)/);
      
      if (activeMatch && overMatch) {
        const activeWeek = parseInt(activeMatch[1], 10);
        const activeDay = parseInt(activeMatch[2], 10);
        const overWeek = parseInt(overMatch[1], 10);
        const overDay = parseInt(overMatch[2], 10);
        
        // Only allow dragging within the same week for now
        if (activeWeek === overWeek) {
          const currentWeek = monthlyData[activeWeek];
          const reordered = arrayMove(currentWeek, activeDay, overDay);
          // Update the monthly data (this would need to be handled by parent component)
        }
      }
    }
  };

  const startCopy = (date: string) => {
    setCopySourceDate(date);
    setCopyTargetDate(null);
    setMenuOpenFor(null);
  };

  const deleteWorkout = (date: string) => {
    if (viewMode === 'weekly') {
      // For weekly view, update the current week
      const updated = days.map((d) => (d.date === date ? { ...d, focus: 'Rest Day', exercises: [] } : d));
      onPlanChange(updated);
    } else {
      // For monthly view, update the entire monthly data structure
      const updatedMonthlyData = monthlyData.map(week => 
        week.map(day => 
          day.date === date 
            ? { ...day, focus: 'Rest Day', exercises: [] }
            : day
        )
      );
      
      // Update local state to reflect changes
      setLocalMonthlyData(updatedMonthlyData);
      
      // Update the current week data (for backward compatibility)
      const updatedCurrentWeek = updatedMonthlyData[0];
      onPlanChange(updatedCurrentWeek);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
    }
    setMenuOpenFor(null);
  };

  const selectTarget = (date: string) => {
    if (copySourceDate == null) return;
    if (date === copySourceDate) return;
    setCopyTargetDate(date);
  };

  const confirmPaste = () => {
    if (copySourceDate == null || copyTargetDate == null) return;
    
    if (viewMode === 'weekly') {
      // For weekly view, find source and target days in current week
      const sourceDay = days.find(d => d.date === copySourceDate);
      if (!sourceDay) return;
      
      const updated = days.map((d) => 
        d.date === copyTargetDate 
          ? { ...d, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] }
          : d
      );
      onPlanChange(updated);
    } else {
      // For monthly view, find source and target days in all days
      const sourceDay = allDays.find(d => d.date === copySourceDate);
      if (!sourceDay) return;
      
      // Update the entire monthly data structure
      const updatedMonthlyData = monthlyData.map(week => 
        week.map(day => 
          day.date === copyTargetDate 
            ? { ...day, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] }
            : day
        )
      );
      
      // Update local state to reflect changes
      setLocalMonthlyData(updatedMonthlyData);
      
      // Update the current week data (for backward compatibility)
      const updatedCurrentWeek = updatedMonthlyData[0];
      onPlanChange(updatedCurrentWeek);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
    }
    
    setCopySourceDate(null);
    setCopyTargetDate(null);
  };

  const cancelPaste = () => {
    setCopySourceDate(null);
    setCopyTargetDate(null);
  };

  const renderDayBox = (day: WeekDay, index: number, weekIndex: number = 0) => {
    const isSource = copySourceDate === day.date;
    const isTarget = copyTargetDate === day.date;
    const isCopyMode = copySourceDate != null;
    
    let baseColors = day.exercises.length > 0 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200';
    const sourceColors = 'bg-blue-600 text-white border-blue-700';
    const targetColors = 'bg-blue-100 text-blue-800 border-blue-200';
    const copyModeColors = 'bg-yellow-50 text-gray-700 border border-yellow-300';
    
    let boxClasses = baseColors;
    if (isSource) {
      boxClasses = sourceColors;
    } else if (isTarget) {
      boxClasses = targetColors;
    } else if (isCopyMode && !isSource) {
      boxClasses = copyModeColors;
    }
    
    const boxId = viewMode === 'weekly' ? `hdr-${index}` : `hdr-${weekIndex}-${index}`;
    const menuId = `menu-${day.date}`;

    return (
      <SortableHeaderBox key={boxId} id={boxId} disabled={copySourceDate != null}>
        <div
          className={`relative p-2 rounded text-center ${boxClasses}`}
          onClick={() => {
            if (copySourceDate != null) selectTarget(day.date);
          }}
        >
          {/* 3-dots menu (popover) */}
          <Popover open={menuOpenFor === menuId} onOpenChange={(open) => setMenuOpenFor(open ? menuId : null)}>
            <PopoverTrigger asChild>
              <button
                className="absolute top-1 right-1 p-1 rounded hover:bg-black/10"
                title="More"
                onMouseDown={(e) => { e.stopPropagation(); }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                onPointerUp={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); }}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="right" className="w-40 p-1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <button
                className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={(e) => { e.stopPropagation(); startCopy(day.date); }}
              >
                Copy workout
              </button>
              <button
                className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={(e) => { e.stopPropagation(); deleteWorkout(day.date); }}
              >
                Delete workout
              </button>
            </PopoverContent>
          </Popover>

          <div className="font-medium">{day.focus}</div>
          <div className="text-xs">{format(parseISO(day.date), 'MMM d')} • {format(parseISO(day.date), 'EEEE')}</div>
          <div className="text-xs mt-1">
            {day.exercises.length > 0 ? `${day.exercises.length} exercise${day.exercises.length > 1 ? 's' : ''}` : 'Rest day'}
          </div>

          {/* Paste controls on target */}
          {isTarget && (
            <div className="absolute top-1 left-1 flex gap-1"
                 onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button className="p-1 rounded bg-white/80 hover:bg-white" title="Save" onClick={confirmPaste}>
                <Check className="h-4 w-4 text-green-600" />
              </button>
              <button className="p-1 rounded bg-white/80 hover:bg-white" title="Cancel" onClick={cancelPaste}>
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </SortableHeaderBox>
    );
  };

  const renderWeeklyView = () => (
    <div className="grid grid-cols-7 gap-2 text-sm">
      {days.map((day, index) => renderDayBox(day, index))}
    </div>
  );

  const renderMonthlyView = () => (
    <div className="space-y-6">
      {monthlyData.map((week, weekIndex) => {
        const weekStart = startOfWeek(addWeeks(planStartDate, weekIndex), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(addWeeks(planStartDate, weekIndex), { weekStartsOn: 0 });
        
        return (
          <div key={weekIndex} className="space-y-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Week {weekIndex + 1}: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-sm">
              {week.map((day, dayIndex) => renderDayBox(day, dayIndex, weekIndex))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan View</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('weekly')}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            7 Day
          </Button>
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('monthly')}
            className="text-xs"
          >
            <CalendarDays className="h-3 w-3 mr-1" />
            Monthly
          </Button>
        </div>
      </div>

      {/* Plan Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={
            viewMode === 'weekly' 
              ? days.map((_, idx) => `hdr-${idx}`)
              : monthlyData.flatMap((week, weekIdx) => 
                  week.map((_, dayIdx) => `hdr-${weekIdx}-${dayIdx}`)
                )
          } 
          strategy={horizontalListSortingStrategy}
        >
          {viewMode === 'weekly' ? renderWeeklyView() : renderMonthlyView()}
        </SortableContext>
      </DndContext>
    </div>
  );
}


