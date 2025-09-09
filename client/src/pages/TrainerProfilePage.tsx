"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, User, Camera, CheckCircle, AlertCircle, Phone, Globe, Briefcase, Award, Clock, DollarSign, Users, Plus, Minus } from "lucide-react"

export default function TrainerProfilePage() {
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editBusinessName, setEditBusinessName] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [editExperienceYears, setEditExperienceYears] = useState(0)
  const [editSessionRate, setEditSessionRate] = useState(0)
  const [editOnlineRate, setEditOnlineRate] = useState(0)
  const [editPreferredHours, setEditPreferredHours] = useState("")
  const [editSpecialties, setEditSpecialties] = useState<string[]>([])
  const [editClientPopulations, setEditClientPopulations] = useState<string[]>([])
  const [editServiceOfferings, setEditServiceOfferings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    business: true,
    pricing: true,
    specialties: true,
    clientPopulations: true,
    serviceOfferings: true
  })

  // Helper functions for array fields
  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const addArrayItem = (array: string[], item: string) => {
    if (item.trim() && !array.includes(item.trim())) {
      return [...array, item.trim()];
    }
    return array;
  };

  const removeArrayItem = (array: string[], item: string) => {
    return array.filter(i => i !== item);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    async function fetchTrainer() {
      setLoading(true)
      setError(null)
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError || !session?.user?.email) {
        setError("Not logged in")
        setLoading(false)
        return
      }
      // Fetch trainer by email
      const { data, error } = await supabase
        .from("trainer")
        .select(`
          id, trainer_name, trainer_email, avatar_url, profile_picture_url,
          phone, business_name, website, experience_years,
          session_rate, online_training_rate, preferred_hours,
          specialties, client_populations, service_offerings
        `)
        .eq("trainer_email", session.user.email)
        .single()
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setTrainer(data)
      setEditName(data.trainer_name || "")
      setEditEmail(data.trainer_email || "")
      setEditPhone(data.phone || "")
      setEditBusinessName(data.business_name || "")
      setEditWebsite(data.website || "")
      setEditExperienceYears(data.experience_years || 0)
      setEditSessionRate(data.session_rate || 0)
      setEditOnlineRate(data.online_training_rate || 0)
      setEditPreferredHours(data.preferred_hours || "")
      setEditSpecialties(data.specialties || [])
      setEditClientPopulations(data.client_populations || [])
      setEditServiceOfferings(data.service_offerings || [])
      setLoading(false)
    }
    fetchTrainer()
  }, [])
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !trainer) return;

    setUploading(true);
    setUploadSuccess(false);
    setError(null);

    try {
        // Upload to Supabase Storage (bucket: "trainer-bucket")
        const fileExt = file.name.split(".").pop();
        const filePath = `h8eltu_1/${trainer.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("trainer-bucket").upload(filePath, file, { upsert: true });
        
        if (uploadError) {
            console.error("Upload Error:", uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("trainer-bucket").getPublicUrl(filePath);
        const avatarUrl = publicUrlData?.publicUrl;
        console.log("Avatar URL:", avatarUrl);

        // Update trainer row
        const { error: updateError } = await supabase
            .from("trainer")
            .update({ profile_picture_url: avatarUrl })
            .eq("id", trainer.id);
        
        if (updateError) {
            console.error("Update Error:", updateError);
            throw updateError;
        }

        setTrainer({ ...trainer, profile_picture_url: avatarUrl });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || "Failed to upload avatar");
    } finally {
        setUploading(false);
    }
}

  async function handleSaveEdit() {
    if (!trainer) return
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from("trainer")
        .update({ 
          trainer_name: editName,
          phone: editPhone,
          business_name: editBusinessName,
          website: editWebsite,
          experience_years: editExperienceYears,
          session_rate: editSessionRate,
          online_training_rate: editOnlineRate,
          preferred_hours: editPreferredHours,
          specialties: editSpecialties,
          client_populations: editClientPopulations,
          service_offerings: editServiceOfferings,
          updated_at: new Date().toISOString()
        })
        .eq("id", trainer.id)
      if (updateError) throw updateError
      setTrainer({ 
        ...trainer, 
        trainer_name: editName,
        phone: editPhone,
        business_name: editBusinessName,
        website: editWebsite,
        experience_years: editExperienceYears,
        session_rate: editSessionRate,
        online_training_rate: editOnlineRate,
        preferred_hours: editPreferredHours,
        specialties: editSpecialties,
        client_populations: editClientPopulations,
        service_offerings: editServiceOfferings
      })
      setEditing(false)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <Skeleton className="h-8 w-48 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="absolute bottom-2 right-2 h-10 w-10 rounded-full" />
                </div>
                <div className="space-y-4 text-center">
                  <Skeleton className="h-7 w-40 mx-auto" />
                  <Skeleton className="h-5 w-56 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Success notification */}
        {uploadSuccess && (
          <div className="mb-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Avatar updated successfully!</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-24"></div>

          <CardContent className="relative pt-0 pb-8">
            {/* Avatar section */}
            <div className="flex flex-col items-center -mt-16 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <Avatar className="relative h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage
                    src={trainer.profile_picture_url || trainer.avatar_url || undefined}
                    alt={trainer.trainer_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {trainer.trainer_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Upload button */}
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload Avatar"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <Camera className="h-4 w-4 text-gray-600" />
                  )}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </div>

              {/* Status badge */}
              <Badge variant="secondary" className="mt-4 bg-green-100 text-green-800 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active Trainer
              </Badge>
            </div>

            {/* Profile information */}
            <div className="space-y-6">
              <div className="text-center">
                {editing ? (
                  <>
                    <input
                      className="text-2xl font-bold text-gray-900 mb-2 border rounded px-2 py-1"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      disabled={loading}
                    />
                    <br />
                    <input
                      className="text-sm text-gray-500 border rounded px-2 py-1"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      disabled={loading}
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{trainer.trainer_name}</h1>
                    <div className="flex items-center justify-center text-sm text-gray-500 mt-1">
                      <Mail className="w-4 h-4 mr-2" />
                      {trainer.trainer_email}
                    </div>
                  </>
                )}
              </div>
              <Separator className="my-6" />
              {/* Contact information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('contact')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.contact ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.contact && (
                <>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Full Name</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.trainer_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Email Address</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        disabled={true} // set to false if you want to allow email editing
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.trainer_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Phone Number</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        disabled={loading}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.phone || "Not provided"}</p>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('business')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.business ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.business && (
                <>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Business Name</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editBusinessName}
                        onChange={e => setEditBusinessName(e.target.value)}
                        disabled={loading}
                        placeholder="Enter business name"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.business_name || "Not provided"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editWebsite}
                        onChange={e => setEditWebsite(e.target.value)}
                        disabled={loading}
                        placeholder="Enter website URL"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">
                        {trainer.website ? (
                          <a href={trainer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {trainer.website}
                          </a>
                        ) : "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Years of Experience</p>
                    {editing ? (
                      <input
                        type="number"
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editExperienceYears}
                        onChange={e => setEditExperienceYears(parseInt(e.target.value) || 0)}
                        disabled={loading}
                        min="0"
                        max="50"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.experience_years || 0} years</p>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Pricing Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pricing Information</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('pricing')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.pricing ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.pricing && (
                <>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Session Rate (per hour)</p>
                    {editing ? (
                      <input
                        type="number"
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editSessionRate}
                        onChange={e => setEditSessionRate(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">${trainer.session_rate || 0}/hour</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Online Training Rate (per hour)</p>
                    {editing ? (
                      <input
                        type="number"
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editOnlineRate}
                        onChange={e => setEditOnlineRate(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">${trainer.online_training_rate || 0}/hour</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Preferred Hours</p>
                    {editing ? (
                      <input
                        className="text-sm text-gray-600 border rounded px-2 py-1 w-full"
                        value={editPreferredHours}
                        onChange={e => setEditPreferredHours(e.target.value)}
                        disabled={loading}
                        placeholder="e.g., 9 AM - 6 PM"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.preferred_hours || "Not specified"}</p>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Specialties */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Specialties</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('specialties')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.specialties ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.specialties && (
                <>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm text-gray-600 border rounded px-2 py-1"
                        placeholder="Add a specialty"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            setEditSpecialties(addArrayItem(editSpecialties, input.value));
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a specialty"]') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            setEditSpecialties(addArrayItem(editSpecialties, input.value));
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editSpecialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {specialty}
                          <button
                            onClick={() => setEditSpecialties(removeArrayItem(editSpecialties, specialty))}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trainer.specialties && trainer.specialties.length > 0 ? (
                      trainer.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {specialty}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No specialties listed</p>
                    )}
                  </div>
                )}
                </>
                )}
              </div>

              {/* Client Populations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Client Populations</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('clientPopulations')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.clientPopulations ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.clientPopulations && (
                <>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm text-gray-600 border rounded px-2 py-1"
                        placeholder="Add a client population"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            setEditClientPopulations(addArrayItem(editClientPopulations, input.value));
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a client population"]') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            setEditClientPopulations(addArrayItem(editClientPopulations, input.value));
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editClientPopulations.map((population, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {population}
                          <button
                            onClick={() => setEditClientPopulations(removeArrayItem(editClientPopulations, population))}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trainer.client_populations && trainer.client_populations.length > 0 ? (
                      trainer.client_populations.map((population: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {population}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No client populations listed</p>
                    )}
                  </div>
                )}
                </>
                )}
              </div>

              {/* Service Offerings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Service Offerings</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('serviceOfferings')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.serviceOfferings ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.serviceOfferings && (
                <>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm text-gray-600 border rounded px-2 py-1"
                        placeholder="Add a service offering"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            setEditServiceOfferings(addArrayItem(editServiceOfferings, input.value));
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a service offering"]') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            setEditServiceOfferings(addArrayItem(editServiceOfferings, input.value));
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editServiceOfferings.map((offering, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {offering}
                          <button
                            onClick={() => setEditServiceOfferings(removeArrayItem(editServiceOfferings, offering))}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trainer.service_offerings && trainer.service_offerings.length > 0 ? (
                      trainer.service_offerings.map((offering: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {offering}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No service offerings listed</p>
                    )}
                  </div>
                )}
                </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                {editing ? (
                  <>
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" onClick={handleSaveEdit} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1 border-gray-300" onClick={() => { 
                      setEditing(false); 
                      setEditName(trainer.trainer_name || ""); 
                      setEditEmail(trainer.trainer_email || ""); 
                      setEditPhone(trainer.phone || ""); 
                      setEditBusinessName(trainer.business_name || ""); 
                      setEditWebsite(trainer.website || ""); 
                      setEditExperienceYears(trainer.experience_years || 0); 
                      setEditSessionRate(trainer.session_rate || 0); 
                      setEditOnlineRate(trainer.online_training_rate || 0); 
                      setEditPreferredHours(trainer.preferred_hours || ""); 
                      setEditSpecialties(trainer.specialties || []); 
                      setEditClientPopulations(trainer.client_populations || []); 
                      setEditServiceOfferings(trainer.service_offerings || []); 
                    }} disabled={loading}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="flex-1 border-gray-300 hover:bg-gray-50">
                      View Schedule
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </div>
  )
}
