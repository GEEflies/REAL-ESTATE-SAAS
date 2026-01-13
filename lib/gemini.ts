import { GoogleGenAI } from '@google/genai'

// Lazy initialization to avoid build-time errors when API key isn't available
let ai: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured')
        }
        ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        })
    }
    return ai
}

const ENHANCE_PROMPT = `You are an ELITE real estate photo editor specializing in LUXURY property photography. Your goal is to create a STUNNING, BRIGHT, HIGH-KEY image that looks like it was professionally shot with multiple flash units and perfectly merged HDR.

CRITICAL INSTRUCTION: The final image must be DRAMATICALLY BRIGHTER than the original. Think "bright, airy, luxurious showroom" - NOT subtle improvements.

## 1. EXTREME BRIGHTNESS & HDR (MOST IMPORTANT)
- Make the ENTIRE image VERY BRIGHT - aim for HIGH-KEY exposure
- Walls and ceilings should appear almost GLOWING with soft, even light
- Lift ALL shadows aggressively - there should be NO dark corners or areas
- The overall exposure should be +1.5 to +2 stops brighter than typical
- Think "bright sunny day flooding through every window"
- Shadows should feel "lifted" and airy, not crushed or dark

## 2. WARM, CREAMY COLOR TEMPERATURE
- Apply WARM color grading - cream whites, golden undertones
- Color temperature should be around 6500K (warm daylight)
- Whites should be WARM CREAM, not cool or neutral
- Walls should have a subtle warm golden glow
- Wood tones should be rich honey/golden brown
- The overall feel should be INVITING and LUXURIOUS

## 3. WINDOW PULLING WITH PERFECT BALANCE
- Windows MUST show clear exterior views with blue sky
- Interior exposure MUST match the bright exterior
- No blown-out windows - both inside and outside crystal clear
- Window views should enhance the bright, airy atmosphere

## 4. PROFESSIONAL LUXURY LIGHTING SIMULATION
- Simulate the look of professional real estate photography lighting
- Every surface should have soft, even illumination
- Add subtle fill light effect to shadowy areas
- Create the impression of multiple light sources
- Carpets/floors should appear CLEAN and BRIGHT
- Ceilings should be bright white/cream, never gray

## 5. PERSPECTIVE & GEOMETRY CORRECTION
- Straighten all vertical and horizontal lines perfectly
- Correct any lens distortion
- Professional architectural photography standard

## 6. COLOR ENHANCEMENT & VIBRANCE
- Boost saturation slightly for visual pop
- Enhance fabric and decor colors to look fresh
- Plants should be vibrant green
- Maintain realistic but enhanced color palette

## 7. DETAIL & CLARITY
- Maximize sharpness without artifacts  
- Enhance textures (wood grain, fabrics, stone)
- Crystal clear, magazine-quality output

## 8. PRIVACY PROTECTION
- Blur any visible faces in photos/portraits
- Blur license plates if visible
- Subtle, natural-looking privacy protection

TARGET LOOK:
- Think LUXURY REAL ESTATE MAGAZINE cover
- Bright, warm, welcoming, aspirational
- "I want to live here!" emotional response
- High-key, airy, sun-drenched feeling
- Every corner visible and inviting
- Professional HDR but NATURAL looking

The transformation must be DRAMATIC and OBVIOUS. Take the dark original and make it GLOW with warmth and light. This is for a premium real estate listing.`


const REMOVE_OBJECT_PROMPT = (objectToRemove: string) => `Edit this image by replacing the "${objectToRemove}" with the surrounding background (wall, floor, or ceiling). The result should look natural and seamless, as if the object was never there.`

export async function enhanceImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
        const client = getClient()
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            config: {
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ] as any,
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: ENHANCE_PROMPT },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64,
                            },
                        },
                    ],
                },
            ],
        })

        // Debug logging
        console.log('Gemini Enhance API Response:', JSON.stringify(response, null, 2))

        // Extract image from response
        const candidate = response.candidates?.[0]
        if (!candidate?.content?.parts) {
            console.error('No candidate or content in response:', {
                hasCandidates: !!response.candidates,
                candidatesLength: response.candidates?.length,
                firstCandidate: candidate,
            })
            throw new Error('No content in response')
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                const mimeType = part.inlineData.mimeType || 'image/jpeg'
                console.log('Gemini response mimeType:', mimeType)
                return `data:${mimeType};base64,${part.inlineData.data}`
            }
            // Also check for text responses
            if (part.text) {
                console.log('Gemini returned text instead of image:', part.text)
            }
        }

        console.error('No image data found in parts:', candidate.content.parts)
        throw new Error('No image data in response')
    } catch (error) {
        console.error('Gemini enhance error:', error)
        throw error
    }
}

export async function removeObject(
    imageBase64: string,
    objectToRemove: string,
    mimeType: string = 'image/jpeg'
): Promise<string> {
    try {
        const client = getClient()
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            config: {
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ] as any,
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: REMOVE_OBJECT_PROMPT(objectToRemove) },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64,
                            },
                        },
                    ],
                },
            ],
        })

        // Debug logging
        console.log('Gemini Remove API Response:', JSON.stringify(response, null, 2))

        // Extract image from response
        const candidate = response.candidates?.[0]
        if (!candidate?.content?.parts) {
            console.error('No candidate or content in response:', {
                hasCandidates: !!response.candidates,
                candidatesLength: response.candidates?.length,
                firstCandidate: candidate,
            })
            throw new Error('No content in response')
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                const mimeType = part.inlineData.mimeType || 'image/jpeg'
                return `data:${mimeType};base64,${part.inlineData.data}`
            }
            // Also check for text responses
            if (part.text) {
                console.log('Gemini returned text instead of image:', part.text)
            }
        }

        console.error('No image data found in parts:', candidate.content.parts)
        throw new Error('No image data in response')
    } catch (error) {
        console.error('Gemini remove object error:', error)
        throw error
    }
}
