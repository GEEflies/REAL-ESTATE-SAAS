import Replicate from 'replicate'

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

        // The output is typically a URL string
        if (typeof output === 'string') {
            console.log('✅ [Replicate] Upscale successful! URL:', output)
            return output
        }

        throw new Error('Unexpected output format from Replicate')
    } catch (error) {
        console.error('❌ [Replicate] Upscaling error:', error)
        console.error('❌ [Replicate] Error message:', error instanceof Error ? error.message : String(error))
        console.error('❌ [Replicate] Full error object:', JSON.stringify(error, null, 2))
        throw error
    }
}
