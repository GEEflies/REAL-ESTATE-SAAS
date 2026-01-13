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
  "output_quality": "4K_ultra_high_definition_magazine_cover_ready",
  "resolution": "4K_3840x2160_or_highest_possible",
  
  "exposure": {
    "CRITICAL": "MAKE_EXTREMELY_BRIGHT",
    "overall_exposure_boost": "+1.5_stops_brighter_than_input",
    "target": "very_high_key_extremely_bright",
    "shadow_lift": "+3_stops_aggressive",
    "highlight_recovery": "full_but_keep_bright",
    "overall_brightness": "MAXIMUM_brightness_like_sunny_day_indoors",
    "dark_corners": "eliminate_completely_no_shadows",
    "walls": "almost_glowing_near_white_very_bright",
    "ceilings": "pure_bright_white",
    "floors_and_carpet": "bright_light_colored_no_dark_areas",
    "midtones": "push_up_significantly"
  },
  
  "white_balance": {
    "CRITICAL": "DO_NOT_MAKE_WARM_OR_ORANGE",
    "color_temperature": "5500K_neutral_daylight",
    "whites": "pure_clean_white_NOT_cream_NOT_yellow",
    "avoid": ["orange_tint", "yellow_cast", "golden_glow", "warm_tungsten"],
    "target_look": "natural_daylight_through_windows",
    "walls": "clean_bright_white_almost_glowing"
  },
  
  "window_treatment": {
    "priority": "high",
    "exterior_visibility": "crystal_clear_sharp",
    "sky": {
      "appearance": "bright_blue_with_white_clouds",
      "visibility": "100%_clear_not_hazy",
      "color": "natural_sky_blue"
    },
    "glass_clarity": "perfectly_transparent",
    "balance": "interior_MUST_be_as_bright_as_exterior"
  },
  
  "color_correction": {
    "saturation": "natural_plus_10%",
    "vibrance": "enhanced_but_realistic",
    "red_fabrics": "true_vibrant_red_not_orange",
    "wood_tones": "natural_brown_not_orange",
    "greens": "healthy_natural_green"
  },
  
  "contrast_and_clarity": {
    "contrast": "medium_preserve_brightness",
    "clarity": "crisp_sharp",
    "local_contrast": "enhanced_for_depth",
    "tone_curve": "lift_shadows_and_midtones_aggressively"
  },
  
  "perspective": {
    "vertical_lines": "perfectly_straight",
    "horizontal_lines": "perfectly_level"
  },
  
  "sharpness": {
    "level": "magazine_print_quality",
    "details": "enhanced_textures"
  },
  
  "privacy": {
    "blur_faces_in_photos": true,
    "blur_license_plates": true
  }
}

CRITICAL BRIGHTNESS REQUIREMENTS - THIS IS THE MOST IMPORTANT:
1. THE IMAGE MUST BE EXTREMELY BRIGHT - like a room flooded with sunlight
2. WALLS should appear ALMOST GLOWING - near white, very bright
3. CEILINGS must be PURE BRIGHT WHITE - no gray tones at all
4. NO DARK AREAS anywhere - every corner and shadow must be completely lifted
5. The overall exposure should be boosted +1.5 stops compared to typical editing
6. Think "high-key photography" - bright, airy, luminous throughout
7. CARPET/FLOORS should be light and bright, not dark or shadowy

The final image should look like the room is flooded with natural daylight from every direction. Make it BRIGHT.`


const REMOVE_OBJECT_PROMPT = (objectToRemove: string) => `You are an expert real estate photo editor. Edit this image by replacing the "${objectToRemove}" with the surrounding background (wall, floor, or ceiling). 

CRITICAL REQUIREMENTS:
1. The result should look natural and seamless, as if the object was never there.
2. OUTPUT RESOLUTION: 4K Ultra High Definition (3840x2160).
3. Ensure textures and lighting match the surrounding area perfectly.
4. Maintain maximum sharpness and detail in the edited area.`


export async function enhanceImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
        const client = getClient()
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
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
            model: 'gemini-3-pro-image-preview',
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
