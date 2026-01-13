import Replicate from 'replicate'
import sharp from 'sharp'

// Lazy initialization
let replicate: Replicate | null = null

function getClient(): Replicate {
    if (!replicate) {
        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error('REPLICATE_API_TOKEN is not configured')
        }
        replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        })
    }
    return replicate
}

export async function upscaleImage(imageInput: string): Promise<string> {
    try {
        console.log('🚀 [Replicate] Starting upscale process...')
        console.log('🔑 [Replicate] API Token present:', !!process.env.REPLICATE_API_TOKEN)

        const client = getClient()

        // Real-ESRGAN model version
        // This is a popular version of Real-ESRGAN on Replicate
        const model = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b"

        console.log('📡 [Replicate] Calling Replicate API with model:', model)
        console.log('📸 [Replicate] Input image type:', typeof imageInput, 'starts with:', imageInput.substring(0, 30))

        const output = await client.run(model, {
            input: {
                image: imageInput,
                scale: 4, // 4x upscale
                face_enhance: true // Useful for real estate if there are people, but generally harmless
            }
        })

        console.log('✅ [Replicate] Output received:', output)
        console.log('✅ [Replicate] Output type:', typeof output)

        // Handle string output (direct URL)
        if (typeof output === 'string') {
            console.log('✅ [Replicate] Upscale successful! URL:', output)
            return output
        }

        // Handle ReadableStream output (newer SDK versions)
        if (output && typeof output === 'object' && 'getReader' in output) {
            console.log('📖 [Replicate] Output is a ReadableStream, reading...')
            const reader = (output as ReadableStream).getReader()
            const chunks: Uint8Array[] = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                if (value) chunks.push(value)
            }

            // Combine all chunks into a single Uint8Array
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
            const binaryData = new Uint8Array(totalLength)
            let offset = 0
            for (const chunk of chunks) {
                binaryData.set(chunk, offset)
                offset += chunk.length
            }

            console.log('📖 [Replicate] Total binary data size:', binaryData.length, 'bytes')

            // Check if this is PNG data (starts with PNG signature: 0x89 0x50 0x4E 0x47)
            const isPNG = binaryData[0] === 0x89 && binaryData[1] === 0x50 &&
                binaryData[2] === 0x4E && binaryData[3] === 0x47

            // Check if this is JPEG data (starts with 0xFF 0xD8 0xFF)
            const isJPEG = binaryData[0] === 0xFF && binaryData[1] === 0xD8 && binaryData[2] === 0xFF

            if (isPNG || isJPEG) {
                console.log('📖 [Replicate] Detected', isPNG ? 'PNG' : 'JPEG', 'image data, converting and compressing...')

                try {
                    // Compress image using sharp
                    // We compress into JPEG with 85% quality to reduce size significantly (from >20MB to <5MB)
                    const compressedBuffer = await sharp(binaryData)
                        .jpeg({ quality: 85, mozjpeg: true })
                        .toBuffer()

                    console.log('✅ [Replicate] Compressed size:', compressedBuffer.length, 'bytes (Original:', binaryData.length, 'bytes)')

                    // Convert binary to base64
                    const base64 = compressedBuffer.toString('base64')
                    const dataUrl = `data:image/jpeg;base64,${base64}`

                    console.log('✅ [Replicate] Upscale successful! Base64 data URL created')
                    return dataUrl
                } catch (sharpError) {
                    console.error('❌ [Replicate] Compression failed:', sharpError)
                    // Fallback to original if compression fails
                    const base64 = Buffer.from(binaryData).toString('base64')
                    const mimeType = isPNG ? 'image/png' : 'image/jpeg'
                    return `data:${mimeType};base64,${base64}`
                }
            }

            // Try to decode as text (might be URL or JSON)
            const decoder = new TextDecoder()
            const result = decoder.decode(binaryData)
            console.log('📖 [Replicate] Stream result as text:', result.substring(0, 100))

            // The result might be a URL string
            if (result.startsWith('http')) {
                console.log('✅ [Replicate] Upscale successful! URL from stream:', result)
                return result
            }

            // Try parsing as JSON
            try {
                const parsed = JSON.parse(result)
                if (typeof parsed === 'string') {
                    console.log('✅ [Replicate] Upscale successful! Parsed URL:', parsed)
                    return parsed
                }
                if (parsed.output) {
                    console.log('✅ [Replicate] Upscale successful! Parsed output:', parsed.output)
                    return parsed.output
                }
            } catch {
                // Not JSON, return as-is if it looks like a URL
                if (result.trim().startsWith('http')) {
                    return result.trim()
                }
            }
        }

        // Handle array output (some models return [url])
        if (Array.isArray(output) && output.length > 0) {
            const firstItem = output[0]
            if (typeof firstItem === 'string') {
                console.log('✅ [Replicate] Upscale successful! Array URL:', firstItem)
                return firstItem
            }
        }

        // Handle object with output property
        if (output && typeof output === 'object' && 'output' in output) {
            const out = (output as { output: unknown }).output
            if (typeof out === 'string') {
                console.log('✅ [Replicate] Upscale successful! Object URL:', out)
                return out
            }
        }

        console.error('❌ [Replicate] Unhandled output format:', JSON.stringify(output))
        throw new Error('Unexpected output format from Replicate')
    } catch (error) {
        console.error('❌ [Replicate] Upscaling error:', error)
        console.error('❌ [Replicate] Error message:', error instanceof Error ? error.message : String(error))
        throw error
    }
}
