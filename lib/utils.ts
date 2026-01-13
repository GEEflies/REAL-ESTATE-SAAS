import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isValidImageType(type: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(type)
}

export function getBase64FromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const result = reader.result as string
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = (error) => reject(error)
    })
}

// Compress and resize image to reduce file size for upload
export function compressImage(file: File, maxSizeMB: number = 4, maxDimension: number = 2048): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width
                let height = img.height

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension
                        width = maxDimension
                    } else {
                        width = (width / height) * maxDimension
                        height = maxDimension
                    }
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)

                // Start with high quality and reduce if needed
                let quality = 0.85
                let base64 = canvas.toDataURL('image/jpeg', quality)

                // Reduce quality if still too large (aim for under maxSizeMB)
                const maxBytes = maxSizeMB * 1024 * 1024
                while (base64.length * 0.75 > maxBytes && quality > 0.3) {
                    quality -= 0.1
                    base64 = canvas.toDataURL('image/jpeg', quality)
                }

                // Remove data URL prefix
                const cleanBase64 = base64.split(',')[1]

                console.log(`Image compressed: ${file.size} bytes -> ~${Math.round(cleanBase64.length * 0.75)} bytes (quality: ${quality.toFixed(1)})`)

                resolve({ base64: cleanBase64, mimeType: 'image/jpeg' })
            }
            img.onerror = reject
            img.src = e.target?.result as string
        }
        reader.onerror = reject
    })
}
