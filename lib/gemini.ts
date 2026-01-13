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

const ENHANCE_PROMPT = `You are an expert real estate photo editor. Apply ALL of the following professional enhancements as specified:

{
  "task": "professional_real_estate_photo_enhancement",
  "output_quality": "4K_ultra_high_definition_magazine_ready",
  "resolution": "4K_3840x2160_or_highest_possible",

  "1_HDR_MERGE": {
    "description": "Merge multiple exposure levels into balanced HDR",
    "overall_exposure_boost": "+0.5_stops_brighter_than_typical",
    "shadow_recovery": "+2_stops_lift_all_dark_areas",
    "highlight_recovery": "preserve_window_and_bright_areas",
    "overall_exposure": "bright_professional_but_not_overexposed",
    "walls": "bright_near_white_with_subtle_texture_visible",
    "ceilings": "bright_white",
    "floors_and_carpet": "bright_light_beige_not_dark",
    "avoid": ["washed_out", "overexposed", "flat_look"],
    "preserve": "texture_and_detail_while_keeping_bright"
  },

  "2_WINDOW_PULL": {
    "description": "Make exterior view through windows crystal clear",
    "exterior_visibility": "100%_clear_and_sharp",
    "sky_visible": true,
    "balance": "interior_and_exterior_both_properly_exposed",
    "glass_clarity": "perfectly_transparent_no_haze"
  },

  "3_SKY_REPLACEMENT": {
    "description": "Replace dull or overcast sky with appealing blue sky",
    "sky_color": "natural_bright_blue",
    "clouds": "soft_white_natural_clouds",
    "apply_when": "sky_is_gray_overcast_or_blown_out"
  },

  "4_WHITE_BALANCE": {
    "description": "Correct color temperature to neutral daylight",
    "color_temperature": "5500K_neutral_daylight",
    "whites": "pure_clean_white_no_color_cast",
    "avoid": ["orange_tint", "yellow_cast", "blue_cast", "green_tint"],
    "result": "natural_true_to_life_colors"
  },

  "5_PERSPECTIVE_CORRECTION": {
    "description": "Straighten architectural lines",
    "vertical_lines": "perfectly_straight_walls_and_doorframes",
    "horizontal_lines": "perfectly_level_floors_and_ceilings",
    "lens_distortion": "fully_corrected"
  },

  "6_IMAGE_RELIGHTING": {
    "description": "Enhance lighting for even, professional illumination",
    "dark_corners": "subtly_brighten_to_match_room",
    "shadows": "lift_while_preserving_depth_and_dimension",
    "highlights": "soft_natural_not_blown_out",
    "overall_lighting": "even_professional_but_natural",
    "avoid": ["flat_shadowless_look", "artificial_appearance"]
  },

  "7_RAW_QUALITY": {
    "description": "Maximize detail and sharpness",
    "sharpness": "magazine_print_quality",
    "texture_enhancement": "wood_grain_fabric_stone_clearly_visible",
    "noise_reduction": "clean_but_preserve_detail",
    "output": "4K_ultra_high_definition"
  },

  "8_AUTO_PRIVACY": {
    "description": "Protect sensitive information",
    "blur_faces_in_photos": true,
    "blur_license_plates": true,
    "blur_personal_documents": true,
    "style": "subtle_natural_gaussian_blur"
  },

  "9_COLOR_CORRECTION": {
    "description": "Enhance colors for vibrant natural appearance",
    "saturation": "+15%_boost_for_vibrant_look",
    "vibrance": "enhanced_especially_in_muted_areas",
    "red_fabrics": "rich_vibrant_true_red",
    "wood_tones": "warm_natural_brown",
    "greens": "healthy_vibrant_natural",
    "maintain": "color_accuracy_and_separation"
  }
}

CRITICAL BALANCE REQUIREMENTS:
1. BALANCED EXPOSURE - Bright but NOT washed out or overexposed
2. PRESERVE TEXTURE - Walls, carpet, and surfaces must show visible texture and detail
3. MAINTAIN DEPTH - Keep natural shadows for 3D dimensional look, do NOT flatten the image
4. VIBRANT COLORS - Colors should be saturated and rich, NOT muted or desaturated
5. NATURAL LOOK - The result should look like professional photography, not over-processed

The goal is a PROFESSIONAL REAL ESTATE MAGAZINE quality image that looks natural and inviting, with perfect window views, balanced lighting, and vibrant colors. NOT flat, NOT washed out, NOT overexposed.`


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
