import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ContentEditable } from './ui/content-editable';

interface EditableField {
  id: string;
  label: string;
  value: string | number;
  type: 'text' | 'number' | 'textarea';
  minWidth: string;
  maxWidth: string;
}

const InlineEditingTest: React.FC = () => {
  const [fields, setFields] = useState<EditableField[]>([
    { 
      id: 'meal', 
      label: 'Meal Name', 
      value: 'Grilled Chicken Salad with Avocado and Mediterranean Quinoa Bowl', 
      type: 'textarea',
      minWidth: '120px',
      maxWidth: '300px'
    },
    { 
      id: 'calories', 
      label: 'Calories', 
      value: 350, 
      type: 'number',
      minWidth: '50px',
      maxWidth: '80px'
    },
    { 
      id: 'protein', 
      label: 'Protein (g)', 
      value: 25, 
      type: 'number',
      minWidth: '50px',
      maxWidth: '80px'
    },
    { 
      id: 'carbs', 
      label: 'Carbs (g)', 
      value: 15, 
      type: 'number',
      minWidth: '50px',
      maxWidth: '80px'
    },
    { 
      id: 'fats', 
      label: 'Fats (g)', 
      value: 12, 
      type: 'number',
      minWidth: '50px',
      maxWidth: '80px'
    },
    { 
      id: 'amount', 
      label: 'Amount', 
      value: '1 cup with extra toppings', 
      type: 'text',
      minWidth: '80px',
      maxWidth: '150px'
    },
  ]);

  const handleSave = (fieldId: string, newValue: string) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, value: field.type === 'number' ? Number(newValue) || 0 : newValue }
        : field
    ));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>ContentEditable Test - Fixed Dimensions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test the ContentEditable component with proper width and height constraints. 
            Notice how the editing maintains consistent dimensions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => (
              <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {field.label}:
                </div>
                <div className="flex items-center gap-2">
                  <ContentEditable
                    value={field.value}
                    onSave={(newValue) => handleSave(field.id, newValue)}
                    minWidth={field.minWidth}
                    maxWidth={field.maxWidth}
                    multiline={field.type === 'textarea'}
                    numeric={field.type === 'number'}
                    placeholder={`Click to edit ${field.label.toLowerCase()}`}
                    className="flex-1"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Width: {field.minWidth} - {field.maxWidth} | Type: {field.type}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Expected Behavior:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Click on any field to start editing</li>
              <li>• Width and height should remain consistent</li>
              <li>• Long text should wrap within the container</li>
              <li>• No horizontal expansion during editing</li>
              <li>• Press Enter to save, Escape to cancel</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineEditingTest; 