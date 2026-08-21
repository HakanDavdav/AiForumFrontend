import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { mediaApi } from '../../api/mediaApi';
import { Loader2, UploadCloud, Camera, Trash2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AvatarUpload({
  imageUrl,
  onImageUploaded,
  disabled,
  size = 150,
  shape = 'circle',
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file) => mediaApi.uploadAvatar(file),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      if (res.data?.succeeded && res.data?.data) {
        onImageUploaded(res.data.data);
        toast.success(t('upload.success', 'Resim başarıyla yüklendi.'));
      }
    },
    onSettled: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  const isUploading = uploadMutation.isPending;

  const processFile = (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/pjpeg', 'image/jfif'];
    const extension = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const isAllowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'].includes(extension);

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      toast.error(t('upload.invalid_type', 'Desteklenmeyen dosya türü. (JPEG, PNG, WEBP, GIF, JFIF)'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('upload.size_error', 'Dosya boyutu 5MB dan küçük olmalıdır.'));
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onImageUploaded) {
      onImageUploaded('');
    }
  };

  const borderRadius = shape === 'circle' ? '50%' : '16px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      {/* Avatar Preview Box */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: borderRadius,
          background: isDragging ? 'var(--color-primary-light, rgba(99, 102, 241, 0.1))' : 'var(--color-surface-raised)',
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
          boxShadow: isHovered && !disabled ? '0 6px 20px rgba(0, 0, 0, 0.18)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
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
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
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
                background: 'rgba(0, 0, 0, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                color: '#fff',
                borderRadius: borderRadius,
              }}
            >
              <Camera size={28} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
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
              gap: 8,
              color: isHovered ? 'var(--color-primary)' : 'var(--color-text-faint)',
              transition: 'color 0.2s ease',
            }}
          >
            <UploadCloud size={40} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {t('upload.drag_or_click', 'Görsel Seç')}
            </span>
          </div>
        )}
      </div>

      {/* Control Actions & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, flex: 1 }}>
        <input
          type="file"
          accept="image/jpeg, image/png, image/gif, image/webp, image/pjpeg, .jfif, .jpg, .jpeg, .png, .gif, .webp"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

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
            {imageUrl ? t('upload.change_image', 'Görseli Değiştir') : t('upload.select_image', 'Görsel Seç')}
          </button>

          {imageUrl && (
            <button
              type="button"
              className="btn"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 10,
                background: 'transparent',
                border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.3))',
                color: 'var(--color-error, #ef4444)',
                cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={t('upload.remove_image', 'Görseli Kaldır')}
            >
              <Trash2 size={15} />
              {t('upload.remove', 'Kaldır')}
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {t('upload.drag_hint', 'Görseli sürükleyip bırakabilir veya tıklayarak yükleyebilirsiniz.')}
          <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 2 }}>
            {t('upload.limits', 'Maksimum 5MB (PNG, JPEG, WEBP, GIF, JFIF)')}
          </div>
        </div>
      </div>
    </div>
  );
}
