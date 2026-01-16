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

// Enhancement mode types
export type EnhanceMode =
    | 'full'
    | 'hdr'
    | 'window'
    | 'sky'
    | 'white_balance'
    | 'perspective'
    | 'relighting'
    | 'raw_quality'
    | 'privacy'
    | 'color'

// Addon enhancement types for checkbox features
export type EnhanceAddon = 'window' | 'sky' | 'white_balance' | 'perspective' | 'privacy'

// Mode-specific prompts - each prioritizes its feature at the TOP
const MODE_PROMPTS: Record<EnhanceMode, string> = {
    full: `You are an expert real estate photo editor. Apply ALL of the following professional enhancements:

APPLY ALL THESE ENHANCEMENTS:
1. HDR MERGE: Lift shadows +3 stops, protect highlights from clipping, bright airy look
2. WINDOW PULL: Make exterior views through windows crystal clear with visible blue sky
3. SKY REPLACEMENT: Replace gray/overcast sky with natural bright blue sky and clouds
4. WHITE BALANCE: Correct to 5500K neutral daylight, pure whites without color cast
5. PERSPECTIVE: Straighten all vertical and horizontal architectural lines
6. RELIGHTING: Even professional illumination, eliminate dark corners
7. RAW QUALITY: 4K ultra high definition, magazine print sharpness
8. AUTO PRIVACY: Blur all license plates and faces completely
9. COLOR CORRECTION: +15% saturation boost, vibrant natural colors

IMPORTANT: MAINTAIN THE EXACT ASPECT RATIO AND COMPOSITION OF THE ORIGINAL IMAGE. DO NOT CROP OR RESIZE.

Output a professional real estate magazine quality image.`,

    hdr: `You are an expert real estate photo editor. Apply the following professional enhancements for a NATURAL, REALISTIC result:

APPLY THESE ENHANCEMENTS (KEEP IT REALISTIC):
1. HDR MERGE: Lift shadows +3 stops, protect highlights from clipping, bright airy look
2. WINDOW CLARITY: Make windows clear and transparent to show what's outside naturally - if there's a view, show a realistic natural sky (light blue or white/gray depending on natural conditions). DO NOT add trees, fences, buildings, or any landscape elements that aren't actually visible.
3. WHITE BALANCE: Correct to 5500K neutral daylight, pure whites without color cast
4. PERSPECTIVE: Straighten all vertical and horizontal architectural lines
5. RELIGHTING: Even professional illumination, eliminate dark corners
6. RAW QUALITY: 4K ultra high definition, magazine print sharpness
7. COLOR CORRECTION: +15% saturation boost for vibrant natural colors

CRITICAL RULES - AVOID MISLEADING REAL ESTATE AGENTS:
- DO NOT add fake outdoor elements (trees, fences, gardens, buildings)
- Windows should show ONLY authentic sky - nothing more
- If there's no clear view, just show neutral sky or keep window as-is
- MAINTAIN THE EXACT ASPECT RATIO AND COMPOSITION OF THE ORIGINAL IMAGE
- DO NOT CROP OR RESIZE
- Keep the result natural and photorealistic

Output a professional real estate magazine quality image with authentic, non-misleading enhancement.`,

    window: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS WINDOW PULL.

PRIORITY #1 - WINDOW PULL (THIS IS THE MOST IMPORTANT):
- Make ALL exterior views through windows CRYSTAL CLEAR
- Sky must be visible: bright natural blue with soft white clouds
- Glass must be PERFECTLY TRANSPARENT - no haze, no fog, no glare
- Balance interior and exterior exposure equally
- Exterior landscape/buildings should be sharp and detailed
- Remove any window reflections that obstruct the view

ALSO APPLY:
- HDR balance, color correction, perspective
- 4K output quality

The window views should look like you could step right through them.`,

    sky: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS SKY REPLACEMENT.

PRIORITY #1 - SKY REPLACEMENT (THIS IS THE MOST IMPORTANT):
- Replace ANY gray, overcast, white, or blown-out sky
- New sky: Natural bright blue with soft white fluffy clouds
- Sky must look photorealistic and match the lighting
- Blend sky seamlessly with horizon and building edges
- Maintain natural color temperature in sky
- Time of day should match the interior lighting

ALSO APPLY:
- HDR balance, window clarity, color enhancement
- 4K output quality

The sky should look like a perfect sunny day.`,

    white_balance: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS WHITE BALANCE CORRECTION.

PRIORITY #1 - WHITE BALANCE (THIS IS THE MOST IMPORTANT):
- Correct color temperature to exactly 5500K neutral daylight
- Whites must be PURE CLEAN WHITE - NO color cast at all
- AVOID: orange tint, yellow cast, blue cast, green tint
- Walls and ceilings should be neutral, not warm or cool
- Wood tones should be natural brown, not orange
- Fabrics should show true colors

ALSO APPLY:
- HDR balance, window clarity, perspective
- 4K output quality

The colors should look natural and true-to-life as seen in daylight.`,

    perspective: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS PERSPECTIVE CORRECTION.

PRIORITY #1 - PERSPECTIVE CORRECTION (THIS IS THE MOST IMPORTANT):
- Make ALL vertical lines PERFECTLY STRAIGHT (walls, doorframes, windows)
- Make ALL horizontal lines PERFECTLY LEVEL (floors, ceilings, countertops)
- Correct ALL lens distortion - no barrel or pincushion distortion
- Fix any keystoning or tilting
- Maintain proper proportions after correction

ALSO APPLY:
- HDR balance, color correction, window clarity
- 4K output quality

The architecture should look professionally photographed with perfect geometry.`,

    relighting: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS IMAGE RELIGHTING.

PRIORITY #1 - RELIGHTING (THIS IS THE MOST IMPORTANT):
- Create EVEN, PROFESSIONAL illumination throughout the entire image
- Eliminate ALL dark corners and shadows
- Lift shadows on furniture, lamps, and decor objects
- Highlights should be soft and natural, not harsh
- Lighting should feel warm, inviting, and welcoming
- No artificial or HDR-looking appearance

ALSO APPLY:
- Color correction, perspective, window clarity
- 4K output quality

The room should look like it's lit by beautiful natural light from every direction.`,

    raw_quality: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS MAXIMUM QUALITY OUTPUT.

PRIORITY #1 - RAW QUALITY (THIS IS THE MOST IMPORTANT):
- Output at 4K ULTRA HIGH DEFINITION (3840x2160 or maximum possible)
- MAGAZINE PRINT QUALITY sharpness
- Enhance textures: wood grain, fabric weave, stone detail clearly visible
- Clean noise reduction while preserving fine detail
- Crisp edges and defined surfaces
- Maximum clarity and detail enhancement

ALSO APPLY:
- HDR balance, color correction, perspective
- Window clarity and lighting

The image should be sharp enough for a premium magazine cover print.`,

    privacy: `You are an expert photo editor. YOUR PRIMARY AND MOST CRITICAL TASK IS PRIVACY PROTECTION.

!!!!! ABSOLUTE TOP PRIORITY - AUTO PRIVACY !!!!!
THIS IS THE MOST IMPORTANT INSTRUCTION - DO THIS FIRST:

1. BLUR ALL LICENSE PLATES COMPLETELY
   - Find EVERY license plate in the image
   - Apply STRONG HEAVY BLUR (radius 20+ pixels)
   - The text must be 100% UNREADABLE
   - This is MANDATORY and CRITICAL

2. BLUR ALL FACES IN PHOTOS/FRAMES
   - Any photos on walls showing faces - blur them
   - Any people visible - blur their faces
   - Apply STRONG HEAVY BLUR (radius 20+ pixels)
   - The face must be 100% UNREADABLE
   - This is MANDATORY and CRITICAL

3. BLUR PERSONAL DOCUMENTS
   - Any visible mail, documents, screens with text
    - Apply STRONG HEAVY BLUR (radius 20+ pixels)

ALSO APPLY:
- Standard photo enhancement (HDR, color, sharpness)
- 4K output quality

The license plates and faces MUST be completely unreadable in the final image.`,

    color: `You are an expert real estate photo editor. YOUR PRIMARY TASK IS COLOR CORRECTION.

PRIORITY #1 - COLOR CORRECTION (THIS IS THE MOST IMPORTANT):
- Boost saturation by +15-20% for vibrant, appealing colors
- Enhance vibrance especially in muted areas
- Red fabrics: rich, vibrant TRUE red (not orange)
- Wood tones: warm natural brown (not orange or yellow)
- Greens: healthy, vibrant, natural green
- Blues: clean, true blue
- Maintain color accuracy and separation
- Colors should POP but still look natural

ALSO APPLY:
- HDR balance, perspective, window clarity
- 4K output quality

The colors should be magazine-quality vibrant while remaining realistic.`,
}

const REMOVE_OBJECT_PROMPT = (objectToRemove: string) => `You are an expert real estate photo editor. Edit this image by replacing the "${objectToRemove}" with the surrounding background (wall, floor, or ceiling). 

CRITICAL REQUIREMENTS:
1. The result should look natural and seamless, as if the object was never there.
2. OUTPUT RESOLUTION: 4K Ultra High Definition (3840x2160).
3. Ensure textures and lighting match the surrounding area perfectly.
4. Maintain maximum sharpness and detail in the edited area.`


const ADDON_PROMPTS: Record<EnhanceAddon, string> = {
    window: `
=== ADDON: ENHANCED WINDOW PULL ===
PRIORITY: Make ALL exterior views through windows CRYSTAL CLEAR
- Sky visible: bright natural blue with soft white clouds
- Glass PERFECTLY TRANSPARENT - no haze, fog, or glare
- Balance interior and exterior exposure equally
- Sharp detailed exterior landscape
- Remove any window reflections that obstruct the view`,

    sky: `
=== ADDON: SKY REPLACEMENT ===
PRIORITY: Replace gray/overcast/white/blown-out sky
- New sky: Natural bright blue with soft fluffy clouds
- Photorealistic and match lighting
- Blend seamlessly with horizon and building edges
- Natural color temperature`,

    white_balance: `
=== ADDON: ENHANCED WHITE BALANCE ===
PRIORITY: Perfect color temperature correction
- Exactly 5500K neutral daylight throughout
- PURE CLEAN WHITE walls/ceilings - NO color cast
- AVOID: orange tint, yellow cast, blue cast, green tint
- Wood tones: natural brown (not orange)
- Fabrics show true colors`,

    perspective: `
=== ADDON: PRECISION PERSPECTIVE CORRECTION ===
PRIORITY: Perfect architectural geometry
- ALL vertical lines PERFECTLY STRAIGHT (walls, doorframes, windows)
- ALL horizontal lines PERFECTLY LEVEL (floors, ceilings, countertops)
- Correct ALL lens distortion (barrel/pincushion)
- Fix any keystoning or tilting`,

    privacy: `
=== ADDON: AUTO PRIVACY PROTECTION ===
!!!!! ABSOLUTE TOP PRIORITY !!!!!
1. BLUR ALL LICENSE PLATES COMPLETELY
   - Find EVERY license plate in the image
   - Apply STRONG HEAVY BLUR (20+ pixels)
   - The text must be 100% UNREADABLE
   - This is MANDATORY and CRITICAL

2. BLUR ALL FACES IN PHOTOS/FRAMES
   - Any photos on walls showing faces - blur them
   - Any people visible - blur their faces
   - Apply STRONG HEAVY BLUR (20+ pixels)
   - The face must be 100% UNREADABLE
   - This is MANDATORY and CRITICAL

3. BLUR PERSONAL DOCUMENTS
   - Any visible mail, documents, screens with text
   - Apply STRONG HEAVY BLUR (20+ pixels)`
}

// Function to build a layered prompt based on base mode and selected addons
export function buildLayeredPrompt(baseMode: EnhanceMode, addons: EnhanceAddon[] = []): string {
    // Get the base prompt
    let prompt = MODE_PROMPTS[baseMode] || MODE_PROMPTS.full

    // If there are addons, append them with clear separation
    if (addons && addons.length > 0) {
        prompt += '\n\n' + '='.repeat(20) + ' REQUESTED ADD-ON FEATURES ' + '='.repeat(20)

        // Add specific instructions for each selected addon
        // Sort to ensure consistent order if needed, or just iterate
        for (const addon of addons) {
            if (ADDON_PROMPTS[addon]) {
                prompt += '\n' + ADDON_PROMPTS[addon]
            }
        }

        // Add critical rules for valid composition
        prompt += `\n\n=== CRITICAL RULES ===
- DO NOT add fake outdoor elements (trees, fences, buildings) unless Sky Replace is explicitly requested
- Windows show only authentic sky (unless Sky Replace is requested)
- MAINTAIN THE EXACT ASPECT RATIO AND COMPOSITION OF THE ORIGINAL IMAGE
- DO NOT CROP OR RESIZE
- Keep the result natural and photorealistic

Output a professional real estate magazine quality image.`
    }

    return prompt
}

// Legacy function for backwards compatibility
export async function enhanceImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    return enhanceImageWithMode(imageBase64, 'full', mimeType)
}

// New function with mode support
export async function enhanceImageWithMode(
    imageBase64: string,
    mode: EnhanceMode = 'full',
    mimeType: string = 'image/jpeg',
    addons: EnhanceAddon[] = []
): Promise<string> {
    try {
        const client = getClient()
        // Build prompt using the improved layering system
        const prompt = buildLayeredPrompt(mode, addons)

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
                        { text: prompt },
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
        console.log(`Gemini Enhance (${mode}) with Addons (${addons.join(',')}) API Response:`, JSON.stringify(response, null, 2))

        // Extract image from response
        const candidate = response.candidates?.[0]

        // Handle Gemini Safety/Recitation blocks
        if (candidate?.finishReason === 'IMAGE_RECITATION') {
            console.error('Gemini blocked generation due to IMAGE_RECITATION')
            throw new Error('Gemini refused to process this image (Recitation/Copyright trigger). Please try a different photo.')
        }

        if (candidate?.finishReason === 'SAFETY') {
            console.error('Gemini blocked generation due to SAFETY')
            throw new Error('Gemini refused to process this image (Safety trigger).')
        }

        if (!candidate?.content?.parts) {
            console.error('No candidate or content in response:', {
                hasCandidates: !!response.candidates,
                candidatesLength: response.candidates?.length,
                firstCandidate: candidate,
                finishReason: candidate?.finishReason
            })
            throw new Error(`Gemini generation failed: ${candidate?.finishReason || 'Unknown reason'}`)
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
