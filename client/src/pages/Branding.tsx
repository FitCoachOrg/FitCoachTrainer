import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import * as Icons from "@/lib/icons";

// Create schema for branding form
const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Must be a valid hex color code (e.g., #4B5563)",
  }),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Must be a valid hex color code (e.g., #9CA3AF)",
  }),
  messageStyle: z.enum(["professional", "friendly", "motivational"]),
  termsOfService: z.string().min(10, {
    message: "Terms of service must be at least 10 characters",
  }),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

interface EmailTemplate {
  id?: number;
  trainer_id: string;
  template_name: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  logo_url?: string;
  logo_alt_text?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  is_active: boolean;
}

interface TrainerBranding {
  id?: number;
  trainer_id: string;
  business_name?: string;
  website_url?: string;
  contact_email?: string;
  phone_number?: string;
  address?: string;
  social_media?: any;
  custom_css?: string;
}

const Branding: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("branding");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [branding, setBranding] = useState<TrainerBranding | null>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: "",
      primaryColor: "#4338ca",
      secondaryColor: "#9ca3af",
      messageStyle: "professional",
      termsOfService: "Default terms of service for fitness training. Clients must agree to these terms before starting any training program.",
    },
  });

  // Get current trainer ID and load data
  useEffect(() => {
    async function getTrainerId() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          console.log('No session or email found');
          setLoading(false);
          return;
        }

        console.log('Looking up trainer for email:', session.user.email);
        const { data: trainerData, error } = await supabase
          .from('trainer')
          .select('id')
          .eq('trainer_email', session.user.email)
          .single();

        if (error) {
          console.error('Error looking up trainer:', error);
          // Create a temporary trainer ID for testing
          const tempTrainerId = 'temp-' + Date.now();
          setTrainerId(tempTrainerId);
          await loadTemplateAndBranding(tempTrainerId);
        } else if (trainerData) {
          console.log('Found trainer:', trainerData);
          setTrainerId(trainerData.id);
          await loadTemplateAndBranding(trainerData.id);
        } else {
          console.log('No trainer found, creating temporary one');
          const tempTrainerId = 'temp-' + Date.now();
          setTrainerId(tempTrainerId);
          await loadTemplateAndBranding(tempTrainerId);
        }
      } catch (error) {
        console.error('Error getting trainer ID:', error);
        // Create a temporary trainer ID for testing
        const tempTrainerId = 'temp-' + Date.now();
        setTrainerId(tempTrainerId);
        await loadTemplateAndBranding(tempTrainerId);
      } finally {
        setLoading(false);
      }
    }

    getTrainerId();
  }, []);

  const loadTemplateAndBranding = async (trainerId: string) => {
    try {
      console.log('Loading template and branding for trainer:', trainerId);
      
      // Load template
      const { data: templateData, error: templateError } = await supabase
        .from('trainer_email_templates')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('template_name', 'default')
        .single();

      if (templateError) {
        console.log('Template table might not exist yet, using default template');
      }

      if (templateData) {
        console.log('Found existing template:', templateData);
        setTemplate(templateData);
      } else {
        console.log('Creating default template');
        // Create default template
        const defaultTemplate: EmailTemplate = {
          trainer_id: trainerId,
          template_name: 'default',
          subject_template: '{trainer_name} has invited you to download BestFitApp',
          html_template: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  {logo_url ? '<div style="text-align: center; margin-bottom: 20px;"><img src="{logo_url}" alt="{logo_alt_text}" style="max-width: 200px; height: auto;"></div>' : ''}
  <h2 style="color: {primary_color};">You have been invited to join BestFitApp!</h2>
  <p>Hello {client_name},</p>
  <p>{trainer_name} has invited you to download BestFitApp, the ultimate fitness tracking and coaching platform.</p>
  {custom_message}
  <p>To get started:</p>
  <div style="text-align: center; margin: 30px 0;">
    <h3 style="color: {primary_color}; margin-bottom: 15px;">Download BestFitApp</h3>
    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
      <a href="https://apps.apple.com/app/bestfitapp" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        📱 Download for iOS
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.bestfitapp" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        📱 Download for Android
      </a>
    </div>
  </div>
  <p><strong>After downloading:</strong></p>
  <ol style="margin: 20px 0; padding-left: 20px;">
    <li>Open BestFitApp</li>
    <li>Sign up using your email: <strong>{client_email}</strong></li>
    <li>Complete the onboarding questions</li>
    <li>Connect with your trainer</li>
  </ol>
  <p>This will connect you directly with your trainer and set up your personalized fitness dashboard.</p>
  <p>If you have any questions, you can reply directly to this email.</p>
  <p>Looking forward to helping you achieve your fitness goals!</p>
  <p>The {business_name} Team</p>
</div>`,
          text_template: `You have been invited to join BestFitApp!

Hello {client_name},

{trainer_name} has invited you to download BestFitApp, the ultimate fitness tracking and coaching platform.
{custom_message}

To get started:

📱 Download BestFitApp
iOS: https://apps.apple.com/app/bestfitapp
Android: https://play.google.com/store/apps/details?id=com.bestfitapp

After downloading:
1. Open BestFitApp
2. Sign up using your email: {client_email}
3. Complete the onboarding questions
4. Connect with your trainer

This will connect you directly with your trainer and set up your personalized fitness dashboard.

If you have any questions, you can reply directly to this email.

Looking forward to helping you achieve your fitness goals!

The {business_name} Team`,
          primary_color: '#4a6cf7',
          secondary_color: '#ffffff',
          accent_color: '#f3f4f6',
          font_family: 'Arial, sans-serif',
          is_active: true
        };
        setTemplate(defaultTemplate);
      }

      // Load branding
      const { data: brandingData, error: brandingError } = await supabase
        .from('trainer_branding')
        .select('*')
        .eq('trainer_id', trainerId)
        .single();

      if (brandingError) {
        console.log('Branding table might not exist yet, using default branding');
      }

      if (brandingData) {
        console.log('Found existing branding:', brandingData);
        setBranding(brandingData);
      } else {
        console.log('Creating default branding');
        // Create default branding
        const defaultBranding: TrainerBranding = {
          trainer_id: trainerId,
          business_name: 'BestFitApp',
          website_url: 'https://bestfitapp.com',
          contact_email: 'support@bestfitapp.com'
        };
        setBranding(defaultBranding);
      }
    } catch (error) {
      console.error('Error loading template and branding:', error);
      // Create default template even if there's an error
      const defaultTemplate: EmailTemplate = {
        trainer_id: trainerId,
        template_name: 'default',
        subject_template: '{trainer_name} has invited you to download BestFitApp',
        html_template: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #4a6cf7;">You have been invited to join BestFitApp!</h2>
  <p>Hello {client_name},</p>
  <p>{trainer_name} has invited you to download BestFitApp, the ultimate fitness tracking and coaching platform.</p>
  {custom_message}
  <p>To get started:</p>
  <div style="text-align: center; margin: 30px 0;">
    <h3 style="color: #4a6cf7; margin-bottom: 15px;">Download BestFitApp</h3>
    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
      <a href="https://apps.apple.com/app/bestfitapp" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        📱 Download for iOS
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.bestfitapp" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        📱 Download for Android
      </a>
    </div>
  </div>
  <p><strong>After downloading:</strong></p>
  <ol style="margin: 20px 0; padding-left: 20px;">
    <li>Open BestFitApp</li>
    <li>Sign up using your email: <strong>{client_email}</strong></li>
    <li>Complete the onboarding questions</li>
    <li>Connect with your trainer</li>
  </ol>
  <p>This will connect you directly with your trainer and set up your personalized fitness dashboard.</p>
  <p>If you have any questions, you can reply directly to this email.</p>
  <p>Looking forward to helping you achieve your fitness goals!</p>
  <p>The {business_name} Team</p>
</div>`,
        text_template: `You have been invited to join BestFitApp!

Hello {client_name},

{trainer_name} has invited you to download BestFitApp, the ultimate fitness tracking and coaching platform.
{custom_message}

To get started:

📱 Download BestFitApp
iOS: https://apps.apple.com/app/bestfitapp
Android: https://play.google.com/store/apps/details?id=com.bestfitapp

After downloading:
1. Open BestFitApp
2. Sign up using your email: {client_email}
3. Complete the onboarding questions
4. Connect with your trainer

This will connect you directly with your trainer and set up your personalized fitness dashboard.

If you have any questions, you can reply directly to this email.

Looking forward to helping you achieve your fitness goals!

The {business_name} Team`,
        primary_color: '#4a6cf7',
        secondary_color: '#ffffff',
        accent_color: '#f3f4f6',
        font_family: 'Arial, sans-serif',
        is_active: true
      };
      setTemplate(defaultTemplate);
      
      const defaultBranding: TrainerBranding = {
        trainer_id: trainerId,
        business_name: 'BestFitApp',
        website_url: 'https://bestfitapp.com',
        contact_email: 'support@bestfitapp.com'
      };
      setBranding(defaultBranding);
    }
  };

  const saveTemplate = async () => {
    if (!template || !trainerId) return;

    setSaving(true);
    try {
      if (template.id) {
        const { error } = await supabase
          .from('trainer_email_templates')
          .update(template)
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trainer_email_templates')
          .insert([template]);

        if (error) throw error;
      }

      toast({
        title: "Template Saved",
        description: "Your email template has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = async () => {
    if (!branding || !trainerId) return;

    setSaving(true);
    try {
      if (branding.id) {
        const { error } = await supabase
          .from('trainer_branding')
          .update(branding)
          .eq('id', branding.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trainer_branding')
          .insert([branding]);

        if (error) throw error;
      }

      toast({
        title: "Branding Saved",
        description: "Your branding settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: "Failed to save branding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !template) return;

    try {
      const fileName = `logos/${trainerId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('trainer-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('trainer-assets')
        .getPublicUrl(fileName);

      setTemplate({
        ...template,
        logo_url: publicUrl,
        logo_alt_text: file.name
      });

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: BrandingFormValues) => {
    // Handle the original branding form submission
    console.log('Branding form submitted:', data);
    toast({
      title: "Branding updated",
      description: "Your branding settings have been saved successfully.",
    });
  };

  // Preview component for branding
  const BrandingPreview = () => {
    const { primaryColor, secondaryColor, messageStyle } = form.watch();
    
    let messageStyleClass = "font-normal";
    if (messageStyle === "friendly") {
      messageStyleClass = "font-medium text-blue-600 dark:text-blue-400";
    } else if (messageStyle === "motivational") {
      messageStyleClass = "font-bold text-orange-600 dark:text-orange-400";
    }

    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Brand Preview</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Primary Color:</p>
            <div 
              className="w-full h-10 rounded-md border"
              style={{ backgroundColor: primaryColor }}
            ></div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Secondary Color:</p>
            <div 
              className="w-full h-10 rounded-md border"
              style={{ backgroundColor: secondaryColor }}
            ></div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-2">Message Style Sample:</p>
            <p className={messageStyleClass}>
              {messageStyle === "professional" && "We look forward to helping you achieve your fitness goals."}
              {messageStyle === "friendly" && "Hey there! Excited to work with you on your fitness journey! 😊"}
              {messageStyle === "motivational" && "YOU'VE GOT THIS! Every step takes you closer to your goals! 💪"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  console.log('Branding page rendering with:', { 
    loading, 
    trainerId, 
    template: template ? 'template loaded' : 'no template', 
    branding: branding ? 'branding loaded' : 'no branding',
    activeTab 
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branding & Customization</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
          <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Brand</CardTitle>
                <CardDescription>
                  Personalize how your clients see your brand across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <TabsContent value="branding" className="m-0">
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/logo.svg" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter the URL to your logo image (SVG recommended)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="primaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Primary Color</FormLabel>
                                <div className="flex items-center gap-2">
                                  <Input {...field} />
                                  <div 
                                    className="w-10 h-10 rounded-md border"
                                    style={{ backgroundColor: field.value }}
                                  ></div>
                                </div>
                                <FormDescription>
                                  Use hexadecimal color code (e.g., #4338ca)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="secondaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Secondary Color</FormLabel>
                                <div className="flex items-center gap-2">
                                  <Input {...field} />
                                  <div 
                                    className="w-10 h-10 rounded-md border"
                                    style={{ backgroundColor: field.value }}
                                  ></div>
                                </div>
                                <FormDescription>
                                  Use hexadecimal color code (e.g., #9ca3af)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="messageStyle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message Style</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a style" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="friendly">Friendly</SelectItem>
                                    <SelectItem value="motivational">Motivational</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the tone for automated messages to clients
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="email-templates" className="m-0">
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                              id="subject"
                              value={template?.subject_template || ''}
                              onChange={(e) => setTemplate(template ? { ...template, subject_template: e.target.value } : null)}
                              placeholder="Subject template with variables like {trainer_name}, {business_name}"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Available variables: {'{trainer_name}'}, {'{business_name}'}, {'{client_name}'}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="logo">Logo Upload</Label>
                            <Input
                              id="logo"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            {template?.logo_url && (
                              <div className="mt-2">
                                <img src={template.logo_url} alt={template.logo_alt_text} className="max-w-xs" />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="primary-color">Primary Color</Label>
                              <Input
                                id="primary-color"
                                type="color"
                                value={template?.primary_color || '#4a6cf7'}
                                onChange={(e) => setTemplate(template ? { ...template, primary_color: e.target.value } : null)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="secondary-color">Secondary Color</Label>
                              <Input
                                id="secondary-color"
                                type="color"
                                value={template?.secondary_color || '#ffffff'}
                                onChange={(e) => setTemplate(template ? { ...template, secondary_color: e.target.value } : null)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="accent-color">Accent Color</Label>
                              <Input
                                id="accent-color"
                                type="color"
                                value={template?.accent_color || '#f3f4f6'}
                                onChange={(e) => setTemplate(template ? { ...template, accent_color: e.target.value } : null)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="font-family">Font Family</Label>
                            <Input
                              id="font-family"
                              value={template?.font_family || 'Arial, sans-serif'}
                              onChange={(e) => setTemplate(template ? { ...template, font_family: e.target.value } : null)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="html-template">HTML Template</Label>
                            <Textarea
                              id="html-template"
                              value={template?.html_template || ''}
                              onChange={(e) => setTemplate(template ? { ...template, html_template: e.target.value } : null)}
                              rows={20}
                              className="font-mono text-sm"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Available variables: {'{client_name}'}, {'{trainer_name}'}, {'{business_name}'}, {'{signup_url}'}, {'{custom_message}'}, {'{logo_url}'}, {'{primary_color}'}, {'{client_email}'}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="text-template">Plain Text Template</Label>
                            <Textarea
                              id="text-template"
                              value={template?.text_template || ''}
                              onChange={(e) => setTemplate(template ? { ...template, text_template: e.target.value } : null)}
                              rows={15}
                              className="font-mono text-sm"
                            />
                          </div>

                          <Button onClick={saveTemplate} disabled={saving}>
                            {saving ? "Saving..." : "Save Template"}
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="terms" className="m-0">
                        <FormField
                          control={form.control}
                          name="termsOfService"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Terms of Service</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={12}
                                  placeholder="Enter your terms of service here..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                These terms will be displayed to clients during onboarding
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="preview" className="m-0">
                        <BrandingPreview />
                      </TabsContent>
                      
                      <CardFooter className="px-0 pt-6">
                        <Button 
                          type="submit" 
                          disabled={saving}
                          className="ml-auto"
                        >
                          {saving ? (
                            <>
                              <Icons.Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>Save Changes</>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:mt-0 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding Tips</CardTitle>
                <CardDescription>
                  Maximize your brand impact with these professional tips
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
                    <Icons.PaletteIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Color Psychology</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Blue conveys trust and reliability, green suggests health and growth, while red creates urgency and passion.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                    <Icons.MessageCircleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Consistent Messaging</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Keep your tone consistent across all client communications to build a recognizable brand voice.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400">
                    <Icons.ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Visual Identity</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use a high-quality logo that works well at different sizes and across various platforms.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full text-amber-600 dark:text-amber-400">
                    <Icons.ScrollIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Terms of Service</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clear, professional terms build trust while protecting your business. Consider having a legal professional review your terms.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Preview Clients View</CardTitle>
                <CardDescription>
                  See how clients will experience your branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-md text-center">
                  <div className="flex justify-center mb-4">
                    <Icons.MonitorSmartphoneIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Preview how your branding appears across client platforms
                  </p>
                  <Button variant="outline" disabled>
                    Client View (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Branding;
