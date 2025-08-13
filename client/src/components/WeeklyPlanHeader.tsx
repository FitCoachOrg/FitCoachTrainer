"use client"
import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Check, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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
}

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

export default function WeeklyPlanHeader({ week, planStartDate, onReorder, onPlanChange }: WeeklyPlanHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
  const [copySourceIdx, setCopySourceIdx] = useState<number | null>(null);
  const [copyTargetIdx, setCopyTargetIdx] = useState<number | null>(null);

  const days = useMemo(() => week || [], [week]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = parseInt(String(active.id).replace('hdr-', ''), 10);
    const overIndex = parseInt(String(over.id).replace('hdr-', ''), 10);
    const reordered = arrayMove(days, activeIndex, overIndex);
    const updated = reordered.map((day, idx) => {
      const newDate = new Date(planStartDate.getTime() + idx * 24 * 60 * 60 * 1000);
      const newDateStr = newDate.toISOString().slice(0, 10);
      return { ...day, date: newDateStr };
    });
    onReorder(updated);
  };

  const startCopy = (idx: number) => {
    setCopySourceIdx(idx);
    setCopyTargetIdx(null);
    setMenuOpenFor(null);
  };

  const deleteWorkout = (idx: number) => {
    const updated = days.map((d, i) => (i === idx ? { ...d, focus: 'Rest Day', exercises: [] } : d));
    onPlanChange(updated);
    setMenuOpenFor(null);
  };

  const selectTarget = (idx: number) => {
    if (copySourceIdx == null) return;
    if (idx === copySourceIdx) return;
    setCopyTargetIdx(idx);
  };

  const confirmPaste = () => {
    if (copySourceIdx == null || copyTargetIdx == null) return;
    const sourceDay = days[copySourceIdx];
    const updated = days.map((d, i) => (i === copyTargetIdx ? { ...d, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] } : d));
    onPlanChange(updated);
    setCopySourceIdx(null);
    setCopyTargetIdx(null);
  };

  const cancelPaste = () => {
    setCopySourceIdx(null);
    setCopyTargetIdx(null);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={days.map((_, idx) => `hdr-${idx}`)} strategy={horizontalListSortingStrategy}>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {days.map((day, index) => {
            const isSource = copySourceIdx === index;
            const isTarget = copyTargetIdx === index;
            const baseColors = day.exercises.length > 0 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200';
            const sourceColors = 'bg-blue-600 text-white border-blue-700';
            const targetColors = 'bg-blue-100 text-blue-800 border-blue-200';
            const boxClasses = isSource ? sourceColors : isTarget ? targetColors : baseColors;

            return (
              <SortableHeaderBox key={`hdr-${index}`} id={`hdr-${index}`} disabled={copySourceIdx != null}>
                <div
                  className={`relative p-2 rounded text-center ${boxClasses}`}
                  onClick={() => {
                    if (copySourceIdx != null) selectTarget(index);
                  }}
                >
                  {/* 3-dots menu (popover) */}
                  <Popover open={menuOpenFor === index} onOpenChange={(open) => setMenuOpenFor(open ? index : null)}>
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
                        onClick={(e) => { e.stopPropagation(); startCopy(index); }}
                      >
                        Copy workout
                      </button>
                      <button
                        className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => { e.stopPropagation(); deleteWorkout(index); }}
                      >
                        Delete workout
                      </button>
                    </PopoverContent>
                  </Popover>

                  <div className="font-medium">{day.focus}</div>
                  <div className="text-xs">{format(parseISO(day.date), 'MMM d')}</div>
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

                {/* Popover moved to 3-dots button above */}
              </SortableHeaderBox>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}


