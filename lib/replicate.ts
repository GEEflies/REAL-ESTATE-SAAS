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
        const client = getClient()

        // Real-ESRGAN model version
        // This is a popular version of Real-ESRGAN on Replicate
        const model = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b"

        console.log('Starting upscaling with Replicate...')

        const output = await client.run(model, {
            input: {
                image: imageInput,
                scale: 4, // 4x upscale
                face_enhance: true // Useful for real estate if there are people, but generally harmless
            }
        })

        console.log('Replicate output:', output)

        // The output is typically a URL string
        if (typeof output === 'string') {
            return output
        }

        throw new Error('Unexpected output format from Replicate')
    } catch (error) {
        console.error('Replicate upscaling error:', error)
        throw error
    }
}
