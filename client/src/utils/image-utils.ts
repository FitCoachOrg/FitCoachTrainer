import { supabase } from '@/lib/supabase'

/**
 * Get client image URL with proper error handling and fallbacks
 */
export const getClientImageUrl = async (clientId: number): Promise<string | null> => {
  try {
    // Try multiple file extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp']
    
    for (const ext of extensions) {
      const filePath = `${clientId}.${ext}`
      
      // First try to get a signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('client-images')
        .createSignedUrl(filePath, 60 * 60 * 24) // 24 hours expiry
      
      if (signedData?.signedUrl) {
        return signedData.signedUrl
      }
      
      // If signed URL fails, try public URL
      const { data: publicData } = supabase.storage
        .from('client-images')
        .getPublicUrl(filePath)
      
      if (publicData?.publicUrl) {
        // Test if the URL is accessible
        try {
          const response = await fetch(publicData.publicUrl, { method: 'HEAD' })
          if (response.ok) {
            return publicData.publicUrl
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch image ${filePath}:`, fetchError)
          continue
        }
      }
    }
    
    // If no image found, return null
    console.warn(`No image found for client ${clientId}`)
    return null
    
  } catch (error) {
    console.error(`Error getting image for client ${clientId}:`, error)
    return null
  }
}

/**
 * Get multiple client image URLs efficiently
 */
export const getClientImageUrls = async (clientIds: number[]): Promise<{ [clientId: number]: string | null }> => {
  const urls: { [clientId: number]: string | null } = {}
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < clientIds.length; i += batchSize) {
    const batch = clientIds.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (clientId) => {
        urls[clientId] = await getClientImageUrl(clientId)
      })
    )
    
    // Small delay between batches
    if (i + batchSize < clientIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return urls
}

/**
 * Check if an image URL is valid and accessible
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get a fallback avatar URL for clients without images
 */
export const getFallbackAvatarUrl = (clientName: string): string => {
  // Use a service like UI Avatars to generate placeholder avatars
  const encodedName = encodeURIComponent(clientName || 'User')
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128&rounded=true`
}
