import { useState } from "react";
import * as Icons from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Note {
  id: number;
  title: string;
  content: string;
  type: 'general' | 'client' | 'plan';
  relatedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const demoNotes: Note[] = [
  {
    id: 1,
    title: "Client Onboarding Process",
    content: "1. Initial consultation\n2. Goal setting\n3. Fitness assessment\n4. Nutrition assessment\n5. Plan creation\n6. Weekly check-ins",
    type: "general",
    createdAt: new Date(2023, 4, 15),
    updatedAt: new Date(2023, 4, 15),
  },
  {
    id: 2,
    title: "Sarah's Progress Update",
    content: "Sarah has been making excellent progress with her strength training. She's increased her squat weight by 15lbs and reported feeling more energetic throughout the day. Need to adjust her nutrition plan slightly to account for increased activity level.",
    type: "client",
    relatedTo: "Sarah Johnson",
    createdAt: new Date(2023, 4, 10),
    updatedAt: new Date(2023, 4, 12),
  },
  {
    id: 3,
    title: "New HIIT Program Ideas",
    content: "- 30-minute circuit with 45 sec work / 15 sec rest\n- Focus on compound movements\n- Incorporate resistance bands\n- Add mobility work at the end\n- 3x per week structure with progressive overload",
    type: "plan",
    relatedTo: "HIIT Program",
    createdAt: new Date(2023, 4, 8),
    updatedAt: new Date(2023, 4, 8),
  },
];

const Notes = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>(demoNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    relatedTo: "",
  });

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.relatedTo && note.relatedTo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentNote) {
      // Edit existing note
      const updatedNotes = notes.map(note => 
        note.id === currentNote.id 
          ? { 
              ...note, 
              title: formData.title, 
              content: formData.content, 
              type: formData.type as 'general' | 'client' | 'plan',
              relatedTo: formData.relatedTo || undefined,
              updatedAt: new Date()
            } 
          : note
      );
      setNotes(updatedNotes);
      toast({ title: "Note Updated", description: "Your note has been updated successfully." });
    } else {
      // Add new note
      const newNote: Note = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        type: formData.type as 'general' | 'client' | 'plan',
        relatedTo: formData.relatedTo || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([newNote, ...notes]);
      toast({ title: "Note Created", description: "Your new note has been created successfully." });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const editNote = (note: Note) => {
    setCurrentNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      type: note.type,
      relatedTo: note.relatedTo || "",
    });
    setIsDialogOpen(true);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
    toast({ title: "Note Deleted", description: "The note has been deleted." });
  };

  const resetForm = () => {
    setCurrentNote(null);
    setFormData({
      title: "",
      content: "",
      type: "general",
      relatedTo: "",
    });
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Icons.UserIcon className="h-4 w-4" />;
      case 'plan':
        return <Icons.ClipboardIcon className="h-4 w-4" />;
      default:
        return <Icons.ScrollIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Notes & Logs</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Icons.SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleAddNew}>
            <Icons.PlusIcon className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="client">Client Notes</TabsTrigger>
          <TabsTrigger value="plan">Plan Notes</TabsTrigger>
        </TabsList>
        
        {['all', 'general', 'client', 'plan'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-6">
                {filteredNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes
                      .filter(note => tab === 'all' || note.type === tab)
                      .map(note => (
                        <Card key={note.id} className="overflow-hidden h-full border border-gray-200 dark:border-gray-700">
                          <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mr-2">
                                  {getTypeIcon(note.type)}
                                </span>
                                <CardTitle className="text-base">{note.title}</CardTitle>
                              </div>
                              {note.relatedTo && (
                                <CardDescription className="mt-1">
                                  Related to: {note.relatedTo}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex">
                              <Button variant="ghost" size="icon" onClick={() => editNote(note)}>
                                <Icons.PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                                <Icons.TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="whitespace-pre-wrap text-sm h-24 overflow-hidden text-ellipsis">
                              {note.content}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                              Updated {note.updatedAt.toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Icons.ScrollIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold">No notes found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchQuery 
                        ? "Try adjusting your search query." 
                        : "Create your first note to get started."}
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleAddNew}>
                        <Icons.PlusIcon className="h-4 w-4 mr-2" />
                        Create Notes
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentNote ? "Edit Note" : "Create New Note"}</DialogTitle>
            <DialogDescription>
              {currentNote 
                ? "Make changes to your note and save when you're done." 
                : "Add a new note to your collection."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="Note title" 
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select 
                  id="type"
                  name="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="general">General</option>
                  <option value="client">Client Note</option>
                  <option value="plan">Plan Note</option>
                </select>
              </div>
            </div>
            
            {formData.type !== 'general' && (
              <div className="space-y-2">
                <Label htmlFor="relatedTo">Related To</Label>
                <Input 
                  id="relatedTo" 
                  name="relatedTo" 
                  placeholder={formData.type === 'client' ? "Client name" : "Plan name"}
                  value={formData.relatedTo}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea 
                id="content"
                name="content"
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your note here..."
                value={formData.content}
                onChange={handleChange}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentNote ? "Update Note" : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;