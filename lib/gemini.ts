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

const ENHANCE_PROMPT = `You are an expert real estate photo editor. Apply the following enhancements precisely as specified in this JSON configuration:

{
  "task": "professional_real_estate_photo_enhancement",
  "output_quality": "magazine_cover_ready",
  
  "exposure": {
    "target": "high_key_bright",
    "shadow_lift": "+2_stops",
    "highlight_recovery": "full",
    "overall_brightness": "very_bright",
    "dark_corners": "eliminate_completely",
    "walls_and_ceilings": "bright_glowing_appearance"
  },
  
  "white_balance": {
    "CRITICAL": "DO_NOT_MAKE_WARM_OR_ORANGE",
    "color_temperature": "5500K_neutral_daylight",
    "whites": "pure_clean_white_NOT_cream_NOT_yellow",
    "avoid": ["orange_tint", "yellow_cast", "golden_glow", "warm_tungsten"],
    "target_look": "natural_daylight_through_windows",
    "walls": "clean_neutral_white_or_very_light_gray"
  },
  
  "window_treatment": {
    "CRITICAL": "HIGHEST_PRIORITY",
    "exterior_visibility": "crystal_clear_sharp",
    "sky": {
      "appearance": "bright_blue_with_white_clouds",
      "visibility": "100%_clear_not_hazy",
      "color": "natural_sky_blue"
    },
    "glass_clarity": "perfectly_transparent",
    "balance": "interior_and_exterior_equally_exposed",
    "avoid": ["blown_out_white", "hazy_unclear", "foggy_appearance"]
  },
  
  "color_correction": {
    "saturation": "natural_plus_10%",
    "vibrance": "enhanced_but_realistic",
    "red_fabrics": "true_vibrant_red_not_orange",
    "wood_tones": "natural_brown_not_orange",
    "greens": "healthy_natural_green",
    "maintain": "color_accuracy_and_separation"
  },
  
  "contrast_and_clarity": {
    "contrast": "professional_medium_high",
    "clarity": "crisp_sharp_magazine_quality",
    "local_contrast": "enhanced_for_depth",
    "avoid": ["muddy_flat_look", "hazy_appearance"]
  },
  
  "perspective": {
    "vertical_lines": "perfectly_straight",
    "horizontal_lines": "perfectly_level",
    "lens_distortion": "fully_corrected"
  },
  
  "sharpness": {
    "level": "magazine_print_quality",
    "details": "enhanced_textures",
    "edges": "crisp_and_defined"
  },
  
  "privacy": {
    "blur_faces_in_photos": true,
    "blur_license_plates": true,
    "style": "subtle_natural"
  }
}

CRITICAL REQUIREMENTS:
1. WINDOW CLARITY IS #1 PRIORITY - The view through windows MUST be crystal clear with visible blue sky and clouds
2. DO NOT ADD WARM/ORANGE TINT - Keep colors neutral daylight, whites must be PURE WHITE not cream or yellow
3. HIGH KEY BRIGHTNESS - Entire image should be very bright, no dark areas
4. PROFESSIONAL CONTRAST - Image should feel crisp and defined, not muddy or flat

The result should look like a professional real estate magazine cover photo shot in perfect natural daylight conditions.`


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
