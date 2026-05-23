'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { convertToWebp } from '@/lib/utils'

const BUCKET = 'possah-media'

interface MediaFile {
  name:         string
  url:          string
  size:         number
  created_at:   string
  fullPath:     string
}

interface MediaLibraryProps {
  initialFiles: MediaFile[]
}

function formatSize(bytes: number) {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function MediaLibrary({ initialFiles }: MediaLibraryProps) {
  const [files, setFiles]         = useState<MediaFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function uploadFiles(fileList: FileList) {
    setUploading(true)
    setUploadError(null)
    const uploaded: MediaFile[] = []
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      // Validate
      if (!file.type.startsWith('image/') && file.type !== 'video/mp4') {
        errors.push(`${file.name}: only images and MP4 allowed`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: max 10 MB`)
        continue
      }

      // Convert to WebP (SVG and GIF pass through unchanged)
      const uploadFile = file.type.startsWith('image/') && file.type !== 'video/mp4'
        ? await convertToWebp(file)
        : file

      const timestamp = Date.now()
      const safeName  = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
      const path      = `${timestamp}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, uploadFile, { cacheControl: '31536000', upsert: false })

      if (upErr) {
        errors.push(`${file.name}: ${upErr.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      uploaded.push({
        name:       uploadFile.name,
        url:        publicUrl,
        size:       uploadFile.size,
        created_at: new Date().toISOString(),
        fullPath:   path,
      })
    }

    if (errors.length > 0) setUploadError(errors.join(' · '))
    if (uploaded.length > 0) setFiles(prev => [...uploaded, ...prev])
    setUploading(false)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    }
  }

  async function deleteFile(file: MediaFile) {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    setDeleting(file.fullPath)

    const { error } = await supabase.storage.from(BUCKET).remove([file.fullPath])
    if (error) {
      alert(`Delete failed: ${error.message}`)
    } else {
      setFiles(prev => prev.filter(f => f.fullPath !== file.fullPath))
    }
    setDeleting(null)
  }

  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.split('?')[0])

  return (
    <div>
      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border:          `2px dashed ${dragOver ? 'var(--color-gold)' : 'var(--color-border)'}`,
          borderRadius:    '10px',
          padding:         '36px 24px',
          textAlign:       'center',
          cursor:          'pointer',
          backgroundColor: dragOver ? '#FFFBEB' : 'var(--color-surface)',
          marginBottom:    '20px',
          transition:      'all 0.15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/mp4"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Uploading…
          </p>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)', fontWeight: '500' }}>
              Drag & drop or click to upload
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Images (JPG, PNG, WebP, SVG) · Max 10 MB each
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div style={{
          padding:         '10px 14px',
          backgroundColor: '#FEF2F2',
          border:          '1px solid #FCA5A5',
          borderRadius:    '8px',
          marginBottom:    '14px',
          fontFamily:      'var(--font-body)',
          fontSize:        '12px',
          color:           '#DC2626',
        }}>
          {uploadError}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding:         '5px 10px',
                borderRadius:    '5px',
                border:          '1px solid var(--color-border)',
                backgroundColor: viewMode === mode ? 'var(--color-green)' : 'var(--color-surface)',
                color:           viewMode === mode ? '#fff' : 'var(--color-text-muted)',
                fontFamily:      'var(--font-body)',
                fontSize:        '11px',
                cursor:          'pointer',
                fontWeight:      '500',
                textTransform:   'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {files.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
          No files uploaded yet.
        </div>
      )}

      {/* Grid view */}
      {files.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {files.map((file) => (
            <div
              key={file.fullPath}
              style={{
                backgroundColor: 'var(--color-surface)',
                border:          '1px solid var(--color-border)',
                borderRadius:    '8px',
                overflow:        'hidden',
              }}
            >
              {/* Preview */}
              <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', backgroundColor: 'var(--color-bg)' }}>
                {isImage(file.url) ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div style={{ padding: '8px 10px' }}>
                <p style={{
                  fontFamily:  'var(--font-body)',
                  fontSize:    '11px',
                  color:       'var(--color-text)',
                  overflow:    'hidden',
                  textOverflow:'ellipsis',
                  whiteSpace:  'nowrap',
                  marginBottom:'2px',
                }}>
                  {file.name}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {formatSize(file.size)}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => copyUrl(file.url)}
                    style={{
                      flex:            1,
                      padding:         '4px 8px',
                      borderRadius:    '4px',
                      border:          '1px solid var(--color-border)',
                      backgroundColor: copiedUrl === file.url ? '#DCFCE7' : 'var(--color-bg)',
                      color:           copiedUrl === file.url ? '#166534' : 'var(--color-text)',
                      fontFamily:      'var(--font-body)',
                      fontSize:        '10px',
                      cursor:          'pointer',
                      transition:      'all 0.1s',
                    }}
                  >
                    {copiedUrl === file.url ? '✓ Copied' : 'Copy URL'}
                  </button>
                  <button
                    onClick={() => deleteFile(file)}
                    disabled={deleting === file.fullPath}
                    style={{
                      padding:         '4px 8px',
                      borderRadius:    '4px',
                      border:          '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color:           '#DC2626',
                      fontFamily:      'var(--font-body)',
                      fontSize:        '10px',
                      cursor:          deleting === file.fullPath ? 'wait' : 'pointer',
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {files.length > 0 && viewMode === 'list' && (
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Preview', 'Name', 'Size', 'Uploaded', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: '600',
                    color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => (
                <tr key={file.fullPath} style={{ borderBottom: i < files.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-border)', position: 'relative', flexShrink: 0 }}>
                      {isImage(file.url) ? (
                        <Image src={file.url} alt={file.name} fill style={{ objectFit: 'cover' }} sizes="40px" unoptimized />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </p>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)' }}>{formatSize(file.size)}</span>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>{formatDate(file.created_at)}</span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => copyUrl(file.url)}
                        style={{
                          padding:         '5px 11px',
                          borderRadius:    '5px',
                          border:          '1px solid var(--color-border)',
                          backgroundColor: copiedUrl === file.url ? '#DCFCE7' : 'var(--color-bg)',
                          color:           copiedUrl === file.url ? '#166534' : 'var(--color-text)',
                          fontFamily:      'var(--font-body)',
                          fontSize:        '11px',
                          cursor:          'pointer',
                        }}
                      >
                        {copiedUrl === file.url ? '✓ Copied' : 'Copy URL'}
                      </button>
                      <button
                        onClick={() => deleteFile(file)}
                        disabled={deleting === file.fullPath}
                        style={{
                          padding: '5px 11px', borderRadius: '5px',
                          border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2',
                          color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: '11px',
                          cursor: deleting === file.fullPath ? 'wait' : 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
