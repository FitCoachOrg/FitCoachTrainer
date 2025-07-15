import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const DatePickerTestPage = () => {
  const [date, setDate] = useState<Date>(new Date());

  console.log('DatePickerTestPage rendered, date:', date);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Date Picker Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="date-select">Plan Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[280px] justify-start text-left font-normal mt-2"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  console.log('Date selected:', newDate);
                  if (newDate) setDate(newDate);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p><strong>Selected date:</strong> {format(date, "PPP")}</p>
          <p><strong>Date object:</strong> {date.toString()}</p>
        </div>
      </div>
    </div>
  );
};

export default DatePickerTestPage; 