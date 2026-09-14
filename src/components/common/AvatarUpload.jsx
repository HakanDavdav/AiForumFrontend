import React, { useRef, useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { mediaApi } from '../../api/mediaApi'
import { Loader2, UploadCloud, Camera, Trash2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import AvatarCropModal from './AvatarCropModal'

export default function AvatarUpload({
  imageUrl,
  onImageUploaded,
  disabled,
  size = 144,
  shape = 'circle',
  compact = false,
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState(null)
  const [showCrop, setShowCrop] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: (file) => mediaApi.uploadAvatar(file),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const url = res.data?.data || res.data?.Data || (typeof res.data === 'string' ? res.data : null)
      if (res.data?.succeeded !== false && url) {
        onImageUploaded(url)
        toast.success(t('upload.success', 'Resim başarıyla yüklendi.'))
      }
    },
    onSettled: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  const isUploading = uploadMutation.isPending

  const processFile = (file) => {
    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/pjpeg',
      'image/jfif',
    ]
    const extension = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    const isAllowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'].includes(extension)

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      toast.error(
        t('upload.invalid_type', 'Desteklenmeyen dosya türü. (JPEG, PNG, WEBP, GIF, JFIF)')
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('upload.size_error', 'Dosya boyutu 5MB dan küçük olmalıdır.'))
      return
    }

    // Dosyayı data URL'e çevirip crop modal'ı aç
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = useCallback(
    (blob) => {
      setShowCrop(false)
      setCropSrc(null)
      // Blob'u File'a çevirip upload et
      const croppedFile = new File([blob], 'avatar-cropped.jpg', { type: 'image/jpeg' })
      uploadMutation.mutate(croppedFile)
    },
    [uploadMutation]
  )

  const handleCropCancel = useCallback(() => {
    setShowCrop(false)
    setCropSrc(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || isUploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    if (onImageUploaded) {
      onImageUploaded('')
    }
  }

  const borderRadius = shape === 'circle' ? '50%' : '16px'
  const cropShape = shape === 'circle' ? 'round' : 'rect'

  const previewBox = (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: borderRadius,
        background: isDragging
          ? 'var(--color-primary-light, rgba(99, 102, 241, 0.1))'
          : 'var(--color-surface-raised)',
        border: isDragging
          ? '2px dashed var(--color-primary)'
          : `2.5px solid ${isHovered && !disabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        boxShadow:
          isHovered && !disabled
            ? '0 6px 20px rgba(0, 0, 0, 0.18)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Loader2
            size={Math.max(24, Math.round(size * 0.25))}
            style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {t('upload.uploading', 'Yükleniyor...')}
          </span>
        </div>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          {/* Hover overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isHovered
                ? 'rgba(0, 0, 0, 0.65)'
                : compact
                ? 'rgba(0, 0, 0, 0.35)'
                : 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: isHovered ? 1 : compact ? 0.65 : 0,
              transition: 'all 0.25s ease',
              color: '#fff',
              borderRadius: borderRadius,
              backdropFilter: compact && !isHovered ? 'blur(0.5px)' : 'none',
            }}
          >
            <Camera size={Math.max(20, Math.round(size * 0.2))} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.02em',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              {t('upload.change', 'Değiştir')}
            </span>
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: isHovered ? 'var(--color-primary)' : 'var(--color-text-faint)',
            transition: 'color 0.2s ease',
          }}
        >
          <UploadCloud size={Math.max(28, Math.round(size * 0.28))} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>
            {t('upload.drag_or_click', 'Görsel Seç')}
          </span>
        </div>
      )}
    </div>
  )

  const hiddenFileInput = (
    <input
      type="file"
      accept="image/jpeg, image/png, image/gif, image/webp, image/pjpeg, .jfif, .jpg, .jpeg, .png, .gif, .webp"
      ref={fileInputRef}
      style={{ display: 'none' }}
      onChange={handleFileChange}
      disabled={disabled || isUploading}
    />
  )

  const cropModal = (
    <AvatarCropModal
      imageSrc={cropSrc}
      open={showCrop}
      cropShape={cropShape}
      onConfirm={handleCropConfirm}
      onCancel={handleCropCancel}
    />
  )

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          width: size,
          maxWidth: '100%',
        }}
      >
        {hiddenFileInput}
        {previewBox}

        {imageUrl && (
          <div style={{ width: '100%' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
              }}
              title={t('upload.remove_image', 'Görseli Kaldır')}
            >
              <Trash2 size={13} />
              <span>{t('upload.remove', 'Kaldır')}</span>
            </button>
          </div>
        )}

        {cropModal}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      {hiddenFileInput}
      {previewBox}

      {/* Control Actions & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {imageUrl ? <Camera size={16} /> : <ImagePlus size={16} />}
            {imageUrl
              ? t('upload.change_image', 'Görseli Değiştir')
              : t('upload.select_image', 'Görsel Seç')}
          </button>

          {imageUrl && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
              }}
              title={t('upload.remove_image', 'Görseli Kaldır')}
            >
              <Trash2 size={15} />
              <span>{t('upload.remove', 'Kaldır')}</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {t(
            'upload.drag_hint',
            'Görseli sürükleyip bırakabilir veya tıklayarak yükleyebilirsiniz.'
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 2 }}>
            {t('upload.limits', 'Maksimum 5MB (PNG, JPEG, WEBP, GIF, JFIF)')}
          </div>
        </div>
      </div>

      {cropModal}
    </div>
  )
}
