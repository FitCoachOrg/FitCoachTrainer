import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'


interface EmailTemplate {
  id?: number
  trainer_id: string
  template_name: string
  subject_template: string
  html_template: string
  text_template: string
  logo_url?: string
  logo_alt_text?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  font_family?: string
  is_active: boolean
}

interface TrainerBranding {
  id?: number
  trainer_id: string
  business_name?: string
  website_url?: string
  contact_email?: string
  phone_number?: string
  address?: string
  social_media?: any
  custom_css?: string
}

export function EmailTemplateManager() {
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [branding, setBranding] = useState<TrainerBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trainerId, setTrainerId] = useState<string | null>(null)
  const { toast } = useToast()

  // Get current trainer ID
  useEffect(() => {
    async function getTrainerId() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email) return

        const { data: trainerData } = await supabase
          .from('trainer')
          .select('id')
          .eq('trainer_email', session.user.email)
          .single()

        if (trainerData) {
          setTrainerId(trainerData.id)
          await loadTemplateAndBranding(trainerData.id)
        }
      } catch (error) {
        console.error('Error getting trainer ID:', error)
      } finally {
        setLoading(false)
      }
    }

    getTrainerId()
  }, [])

  const loadTemplateAndBranding = async (trainerId: string) => {
    try {
      // Load template
      const { data: templateData } = await supabase
        .from('trainer_email_templates')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('template_name', 'default')
        .single()

      if (templateData) {
        setTemplate(templateData)
      } else {
        // Create default template
        const defaultTemplate: EmailTemplate = {
          trainer_id: trainerId,
          template_name: 'default',
          subject_template: '{trainer_name} has invited you to {business_name}',
          html_template: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  {logo_url ? '<div style="text-align: center; margin-bottom: 20px;"><img src="{logo_url}" alt="{logo_alt_text}" style="max-width: 200px; height: auto;"></div>' : ''}
  <h2 style="color: {primary_color};">You have been invited to {business_name}!</h2>
  <p>Hello {client_name},</p>
  <p>{trainer_name} has invited you to join {business_name}, a platform for fitness coaching and tracking your progress.</p>
  {custom_message}
  <p>To get started:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{signup_url}" style="background-color: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Your Account</a>
  </div>
  <p>This link will connect you directly with your trainer and set up your personalized fitness dashboard.</p>
  <p>If you have any questions, you can reply directly to this email.</p>
  <p>Looking forward to helping you achieve your fitness goals!</p>
  <p>The {business_name} Team</p>
</div>`,
          text_template: `You've been invited to {business_name}!

Hello {client_name},

{trainer_name} has invited you to join {business_name}, a platform for fitness coaching and tracking your progress.
{custom_message}

To get started, create your account by visiting:
{signup_url}

This link will connect you directly with your trainer and set up your personalized fitness dashboard.

If you have any questions, you can reply directly to this email.

Looking forward to helping you achieve your fitness goals!

The {business_name} Team`,
          primary_color: '#4a6cf7',
          secondary_color: '#ffffff',
          accent_color: '#f3f4f6',
          font_family: 'Arial, sans-serif',
          is_active: true
        }
        setTemplate(defaultTemplate)
      }

      // Load branding
      const { data: brandingData } = await supabase
        .from('trainer_branding')
        .select('*')
        .eq('trainer_id', trainerId)
        .single()

      if (brandingData) {
        setBranding(brandingData)
      } else {
        // Create default branding
        const defaultBranding: TrainerBranding = {
          trainer_id: trainerId,
          business_name: 'CoachEZ',
          website_url: 'https://repute.cloud',
                      contact_email: 'support@coachez.ai'
        }
        setBranding(defaultBranding)
      }
    } catch (error) {
      console.error('Error loading template and branding:', error)
    }
  }

  const saveTemplate = async () => {
    if (!template || !trainerId) return

    setSaving(true)
    try {
      if (template.id) {
        // Update existing template
        const { error } = await supabase
          .from('trainer_email_templates')
          .update(template)
          .eq('id', template.id)

        if (error) throw error
      } else {
        // Insert new template
        const { error } = await supabase
          .from('trainer_email_templates')
          .insert([template])

        if (error) throw error
      }

      toast({
        title: "Template Saved",
        description: "Your email template has been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveBranding = async () => {
    if (!branding || !trainerId) return

    setSaving(true)
    try {
      if (branding.id) {
        // Update existing branding
        const { error } = await supabase
          .from('trainer_branding')
          .update(branding)
          .eq('id', branding.id)

        if (error) throw error
      } else {
        // Insert new branding
        const { error } = await supabase
          .from('trainer_branding')
          .insert([branding])

        if (error) throw error
      }

      toast({
        title: "Branding Saved",
        description: "Your branding settings have been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving branding:', error)
      toast({
        title: "Error",
        description: "Failed to save branding. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !template) return

    try {
      // Upload to Supabase Storage
      const fileName = `logos/${trainerId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('trainer-assets')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('trainer-assets')
        .getPublicUrl(fileName)

      setTemplate({
        ...template,
        logo_url: publicUrl,
        logo_alt_text: file.name
      })

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!template || !branding) {
    return <div>Error loading template data</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Template Manager</h1>
        <p className="text-gray-600">Customize your client invitation emails with your branding and messaging.</p>
      </div>

      <Tabs defaultValue="template" className="space-y-4">
        <TabsList>
          <TabsTrigger value="template">Email Template</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Template Settings</CardTitle>
              <CardDescription>Customize the content and styling of your invitation emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={template.subject_template}
                  onChange={(e) => setTemplate({ ...template, subject_template: e.target.value })}
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
                {template.logo_url && (
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
                    value={template.primary_color || '#4a6cf7'}
                    onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={template.secondary_color || '#ffffff'}
                    onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <Input
                    id="accent-color"
                    type="color"
                    value={template.accent_color || '#f3f4f6'}
                    onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Input
                  id="font-family"
                  value={template.font_family || 'Arial, sans-serif'}
                  onChange={(e) => setTemplate({ ...template, font_family: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="html-template">HTML Template</Label>
                <Textarea
                  id="html-template"
                  value={template.html_template}
                  onChange={(e) => setTemplate({ ...template, html_template: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available variables: {'{client_name}'}, {'{trainer_name}'}, {'{business_name}'}, {'{signup_url}'}, {'{custom_message}'}, {'{logo_url}'}, {'{primary_color}'}
                </p>
              </div>

              <div>
                <Label htmlFor="text-template">Plain Text Template</Label>
                <Textarea
                  id="text-template"
                  value={template.text_template}
                  onChange={(e) => setTemplate({ ...template, text_template: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={saveTemplate} disabled={saving}>
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>Set your business information and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={branding.business_name || ''}
                  onChange={(e) => setBranding({ ...branding, business_name: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  value={branding.website_url || ''}
                  onChange={(e) => setBranding({ ...branding, website_url: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={branding.contact_email || ''}
                  onChange={(e) => setBranding({ ...branding, contact_email: e.target.value })}
                  placeholder="contact@yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  value={branding.phone_number || ''}
                  onChange={(e) => setBranding({ ...branding, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={branding.address || ''}
                  onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                  placeholder="Your business address"
                  rows={3}
                />
              </div>

              <Button onClick={saveBranding} disabled={saving}>
                {saving ? "Saving..." : "Save Branding"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>Preview how your invitation email will look to clients.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: template.html_template
                      .replace(/{client_name}/g, 'John Doe')
                      .replace(/{trainer_name}/g, branding.business_name || 'Your Trainer')
                      .replace(/{business_name}/g, branding.business_name || 'CoachEZ')
                      .replace(/{signup_url}/g, '#')
                      .replace(/{custom_message}/g, '')
                      .replace(/{logo_url}/g, template.logo_url || '')
                      .replace(/{primary_color}/g, template.primary_color || '#4a6cf7')
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 