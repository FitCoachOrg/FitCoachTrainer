import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const DatePickerTest = () => {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Date Picker Test</h2>
      
      <div className="grid gap-2 w-full sm:w-auto">
        <Label htmlFor="date-select">Plan Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full sm:w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="mt-4">
        <p>Selected date: {format(date, "PPP")}</p>
      </div>
    </div>
  );
};

export default DatePickerTest; 