/**
 * SAI INDIRABALA FURNITURE - ADMIN IMAGE UPLOAD & PREVIEW UTILITY
 * Handles device photo picking, drag-and-drop, client-side validation,
 * instant local previews, upload progress, and Supabase Storage integration.
 */

import { getSupabase } from './adminClient.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const STORAGE_BUCKET = 'media';

/**
 * Validates a candidate image file.
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
    if (!file) {
        return { valid: false, error: 'No file selected.' };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { 
            valid: false, 
            error: `Unsupported image format (${file.type || 'unknown'}). Please choose JPEG, PNG, or WebP.` 
        };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return { 
            valid: false, 
            error: `Image file is too large (${sizeMb} MB). Maximum allowed size is 5 MB.` 
        };
    }
    return { valid: true };
}

/**
 * Uploads an image file to Supabase Storage and returns its public URL.
 * @param {File} file 
 * @param {string} folder e.g. 'banners', 'products', 'categories', 'gallery'
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadImageToStorage(file, folder = 'uploads') {
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const supabase = await getSupabase();
    if (!supabase) {
        throw new Error('Supabase client is not initialized.');
    }

    // Generate unique, collision-resistant storage path
    const ext = file.name.split('.').pop().toLowerCase() || 'webp';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanPrefix = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
    const storagePath = `${folder}/${Date.now()}_${randomSuffix}_${cleanPrefix}.${ext}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        if (error.message && (error.message.includes('row-level security') || error.message.includes('AccessDenied') || error.message.includes('bucket'))) {
            throw new Error(
                `Supabase Storage upload blocked: ${error.message}. Ensure the "media" bucket is Public and storage policies are active in Supabase SQL Editor.`
            );
        }
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    return publicData.publicUrl;
}

/**
 * Sets up a single image upload component with preview, drag-and-drop, and remove controls.
 * @param {object} config
 */
export function setupImageUploader({
    dropzoneEl,
    fileInputEl,
    previewImgEl,
    previewWrapEl,
    placeholderEl,
    clearBtnEl,
    urlFallbackInputEl,
    fallbackToggleBtnEl,
    fallbackWrapEl,
    folder = 'uploads',
    onFileSelected,
    onFileCleared
}) {
    let currentSelectedFile = null;
    let initialImageUrl = '';
    let isRemoved = false;

    function showPreview(url, fileName = '', fileSize = 0) {
        if (previewImgEl) {
            previewImgEl.src = url;
            previewImgEl.style.display = 'block';
        }
        if (previewWrapEl) previewWrapEl.style.display = 'flex';
        if (placeholderEl) placeholderEl.style.display = 'none';
        if (clearBtnEl) clearBtnEl.style.display = 'inline-flex';

        const nameBadge = previewWrapEl?.querySelector('.upload-filename-badge');
        if (nameBadge) {
            if (fileName) {
                const sizeKb = fileSize > 0 ? ` (${(fileSize / 1024).toFixed(0)} KB)` : '';
                nameBadge.textContent = `${fileName}${sizeKb}`;
                nameBadge.style.display = 'inline-block';
            } else {
                nameBadge.style.display = 'none';
            }
        }
    }

    function clearImage() {
        currentSelectedFile = null;
        if (fileInputEl) fileInputEl.value = '';
        if (urlFallbackInputEl) urlFallbackInputEl.value = '';
        if (previewImgEl) {
            previewImgEl.src = '';
            previewImgEl.style.display = 'none';
        }
        if (previewWrapEl) previewWrapEl.style.display = 'none';
        if (placeholderEl) placeholderEl.style.display = 'flex';
        if (clearBtnEl) clearBtnEl.style.display = 'none';

        isRemoved = true;
        if (typeof onFileCleared === 'function') onFileCleared();
    }

    function handleFile(file) {
        if (!file) return;
        const validation = validateImageFile(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        currentSelectedFile = file;
        isRemoved = false;
        const objectUrl = URL.createObjectURL(file);
        showPreview(objectUrl, file.name, file.size);

        if (typeof onFileSelected === 'function') {
            onFileSelected(file, objectUrl);
        }
    }

    // Attach File Input Listener
    if (fileInputEl) {
        fileInputEl.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        });
    }

    // Drag and Drop support
    if (dropzoneEl) {
        ['dragenter', 'dragover'].forEach(evtName => {
            dropzoneEl.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzoneEl.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(evtName => {
            dropzoneEl.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzoneEl.classList.remove('drag-active');
            });
        });

        dropzoneEl.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt?.files?.[0];
            if (file) handleFile(file);
        });

        dropzoneEl.addEventListener('click', (e) => {
            if (e.target !== clearBtnEl && !clearBtnEl?.contains(e.target)) {
                fileInputEl?.click();
            }
        });
    }

    // Clear Button
    if (clearBtnEl) {
        clearBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearImage();
        });
    }

    // Fallback URL toggle
    if (fallbackToggleBtnEl && fallbackWrapEl) {
        fallbackToggleBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = fallbackWrapEl.style.display === 'none' || !fallbackWrapEl.style.display;
            fallbackWrapEl.style.display = isHidden ? 'block' : 'none';
            fallbackToggleBtnEl.textContent = isHidden ? '▲ Hide URL fallback' : '▼ Or paste image URL';
        });
    }

    if (urlFallbackInputEl) {
        urlFallbackInputEl.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                currentSelectedFile = null;
                isRemoved = false;
                showPreview(url, 'Linked Image');
            }
        });
    }

    return {
        /**
         * Sets initial state when editing an existing record.
         * @param {string} url 
         */
        setInitialUrl(url) {
            initialImageUrl = url || '';
            currentSelectedFile = null;
            isRemoved = false;
            if (url) {
                showPreview(url, 'Current Image');
                if (urlFallbackInputEl) urlFallbackInputEl.value = url;
            } else {
                clearImage();
            }
        },

        /**
         * Resolves the final image URL:
         * 1. If a new file was selected, uploads it and returns the new public URL.
         * 2. If user removed the image, returns ''.
         * 3. If user pasted a fallback URL, returns that URL.
         * 4. If unchanged, returns initialImageUrl.
         * @returns {Promise<string>}
         */
        async resolveFinalUrl() {
            if (currentSelectedFile) {
                return await uploadImageToStorage(currentSelectedFile, folder);
            }
            const fallbackVal = urlFallbackInputEl?.value?.trim();
            if (fallbackVal) {
                return fallbackVal;
            }
            if (isRemoved) {
                return '';
            }
            return initialImageUrl;
        },

        reset() {
            clearImage();
            initialImageUrl = '';
            isRemoved = false;
        },

        hasNewFile() {
            return !!currentSelectedFile;
        }
    };
}
