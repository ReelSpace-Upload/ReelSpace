export interface Video {
  id: string
  user_id?: string
  title?: string | null
  original_filename: string
  file_size: number
  mime_type: string
  share_slug: string
  created_at: string
}

export interface PrepareUploadResponse {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  publicId: string
  accountIndex: number
  uploadUrl: string
  maxBytes: number
  freeBytes: number
}

export interface StorageAccountStatus {
  index: number
  cloudName: string
  usedBytes: number
  limitBytes: number
  freeBytes: number
  usedLabel: string
  freeLabel: string
  limitLabel: string
  canAccept100Mb: boolean
}

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: Video & {
          cloudinary_public_id: string
          cloudinary_cloud_name: string
          cloudinary_account_index: number
          url: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
  }
}
