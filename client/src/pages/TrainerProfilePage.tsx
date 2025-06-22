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
import { Mail, User, Camera, CheckCircle, AlertCircle } from "lucide-react"

export default function TrainerProfilePage() {
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        .select("id, trainer_name, trainer_email, avatar_url")
        .eq("trainer_email", session.user.email)
        .single()
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setTrainer(data)
      setEditName(data.trainer_name)
      setEditEmail(data.trainer_email)
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
            .update({ avatar_url: avatarUrl })
            .eq("id", trainer.id);
        
        if (updateError) {
            console.error("Update Error:", updateError);
            throw updateError;
        }

        setTrainer({ ...trainer, avatar_url: avatarUrl });
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
        .update({ trainer_name: editName/*, trainer_email: editEmail*/ })
        .eq("id", trainer.id)
      if (updateError) throw updateError
      setTrainer({ ...trainer, trainer_name: editName, trainer_email: editEmail })
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
                    src={trainer.avatar_url || undefined}
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
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
                        className="text-sm text-gray-600 border rounded px-2 py-1"
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
                        className="text-sm text-gray-600 border rounded px-2 py-1"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        disabled={true} // set to false if you want to allow email editing
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{trainer.trainer_email}</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                {editing ? (
                  <>
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" onClick={handleSaveEdit} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1 border-gray-300" onClick={() => { setEditing(false); setEditName(trainer.trainer_name); setEditEmail(trainer.trainer_email); }} disabled={loading}>
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
