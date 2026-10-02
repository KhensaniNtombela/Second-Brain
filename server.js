import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   GEMINI
========================================================= */

if (!process.env.GEMINI_API_KEY) {
    console.error("\n❌ GEMINI_API_KEY is missing from .env\n");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/* =========================================================
   EXPRESS
========================================================= */

app.use(express.json({
    limit: "25mb"
}));

app.use(express.static(__dirname));

/* =========================================================
   MODEL CONFIGURATION
========================================================= */

const TEXT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
];

const IMAGE_MODEL = "gemini-3.1-flash-image";

/* =========================================================
   GENERAL AI INSTRUCTIONS
========================================================= */

const GENERAL_SYSTEM_INSTRUCTION = `
You are the AI engine inside an application called AI Second Brain.

Your job is to understand what the user means and actually
complete the task they requested.

NATURAL LANGUAGE UNDERSTANDING IS REQUIRED.

The user does NOT need perfect grammar.

You must understand:

- spelling mistakes
- grammar mistakes
- typos
- missing punctuation
- abbreviations
- informal language
- slang
- lowercase writing
- short requests
- incomplete sentences
- conversational language
- mixed sentence structures

Examples:

"write linkedin post abt my ai project"

means:

"Write a LinkedIn post about my AI project."

"creat html page with 3 cards"

means:

"Create an HTML page with three cards."

"make me pic of sunset paris"

means:

"Generate an image of a sunset in Paris."

"histry report"

should be interpreted according to the
available context and user's apparent intention.

DO NOT criticize the user's grammar.

DO NOT tell the user to rewrite their request
simply because the grammar is imperfect.

If the intended meaning is reasonably clear,
complete the task.

Only ask for clarification when the request is
genuinely ambiguous and completing it would require
an important guess.

ACTUALLY PERFORM THE REQUEST.

Do not merely explain what the user could do.

Produce the useful result.
`;

/* =========================================================
   TEXT INSTRUCTIONS
========================================================= */

const TEXT_SYSTEM_INSTRUCTION = `
${GENERAL_SYSTEM_INSTRUCTION}

TEXT MODE.

You can:

- write
- rewrite
- edit
- summarize
- explain
- brainstorm
- expand
- shorten
- structure
- transform
- create reports
- create emails
- create CV content
- create LinkedIn posts
- create social media content
- create study material
- create plans
- create professional content
- create presentations
- create ideas

Match the user's requested:

- tone
- audience
- purpose
- length
- format

If the request is understandable,
make a sensible interpretation and complete it.

Return the actual requested content.
`;

/* =========================================================
   CODE INSTRUCTIONS
========================================================= */

const CODE_SYSTEM_INSTRUCTION = `
${GENERAL_SYSTEM_INSTRUCTION}

CODE MODE.

You are the coding engine of AI Second Brain.

Create useful, working code.

Examples:

"creat html table"

"make website with nav bar and cards"

"write js that changes background"

"make login page"

"build simple calculator html css js"

When appropriate:

- use the language requested
- preserve requested technologies
- provide complete code
- include HTML, CSS and JavaScript when requested
- make code directly usable
- avoid fake functionality
- avoid unnecessary frameworks
- explain important parts briefly when useful

If the user asks you to fix code,
identify the problem and return corrected code.

Do not return fake code.

Do not return placeholder functionality
when the user asked for working functionality.
`;

/* =========================================================
   IMAGE INSTRUCTIONS
========================================================= */

const IMAGE_SYSTEM_INSTRUCTION = `
${GENERAL_SYSTEM_INSTRUCTION}

IMAGE MODE.

The user wants an actual image.

Generate the requested image.

Do not respond with only a description.

Interpret:

- subject
- environment
- location
- people
- objects
- clothing
- lighting
- colors
- composition
- mood
- artistic style
- photography style
- illustration style
- cinematic style

If the user gives a short request,
make a sensible creative interpretation.

If the user uploads an image and asks to
edit, transform or use it as a reference,
use the uploaded image as visual context.
`;

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "AI Second Brain backend is running.",
        apiConfigured:
            Boolean(process.env.GEMINI_API_KEY),
        textModels:
            TEXT_MODELS,
        imageModel:
            IMAGE_MODEL
    });

});

/* =========================================================
   GENERATION ENDPOINT
========================================================= */

app.post("/api/generate", async (req, res) => {

    try {

        const {
            type,
            prompt,
            file,
            conversation
        } = req.body;

        console.log("\n========================================");
        console.log("NEW AI REQUEST");
        console.log("Type:", type);
        console.log("Prompt:", prompt);
        console.log("Has file:", Boolean(file));
        console.log("========================================\n");

        /* ---------------------------------------------
           API KEY
        --------------------------------------------- */

        if (!process.env.GEMINI_API_KEY) {

            return res.status(500).json({
                success: false,
                error:
                    "GEMINI_API_KEY is not configured."
            });

        }

        /* ---------------------------------------------
           REQUEST TYPE
        --------------------------------------------- */

        if (!type) {

            return res.status(400).json({
                success: false,
                error:
                    "Generation type is required."
            });

        }

        /* ---------------------------------------------
           PROMPT / FILE
        --------------------------------------------- */

        if (!prompt && !file) {

            return res.status(400).json({
                success: false,
                error:
                    "Please provide a prompt or file."
            });

        }

        const generationType =
            String(type).toLowerCase();

        /* ---------------------------------------------
           TEXT
        --------------------------------------------- */

        if (generationType === "text") {

            const result =
                await generateText({
                    prompt,
                    file,
                    conversation
                });

            return res.json(result);
        }

        /* ---------------------------------------------
           CODE
        --------------------------------------------- */

        if (generationType === "code") {

            const result =
                await generateCode({
                    prompt,
                    file,
                    conversation
                });

            return res.json(result);
        }

        /* ---------------------------------------------
           IMAGE
        --------------------------------------------- */

        if (generationType === "image") {

            const result =
                await generateImage({
                    prompt,
                    file
                });

            return res.json(result);
        }

        return res.status(400).json({
            success: false,
            error:
                `Unsupported generation type: ${generationType}`
        });

    } catch (error) {

        console.error(
            "\n❌ GENERATION ERROR:\n",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                getReadableError(error)
        });

    }

});

/* =========================================================
   BUILD MULTIMODAL CONTENT
========================================================= */

function buildContents({
    prompt,
    file,
    conversation
}) {

    const contents = [];

    /* ---------------------------------------------
       PREVIOUS CONVERSATION
    --------------------------------------------- */

    if (
        Array.isArray(conversation) &&
        conversation.length
    ) {

        const recentMessages =
            conversation.slice(-12);

        for (
            const message
            of recentMessages
        ) {

            const content =
                message.content || "";

            if (!content.trim()) {
                continue;
            }

            contents.push({

                role:
                    message.role === "assistant"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text:
                            content
                    }
                ]

            });

        }

    }

    /* ---------------------------------------------
       CURRENT USER REQUEST
    --------------------------------------------- */

    const parts = [];

    /* UPLOADED IMAGE */

    if (file?.data) {

        const base64Data =
            extractBase64(file.data);

        if (base64Data) {

            parts.push({

                inlineData: {

                    mimeType:
                        file.type ||
                        "image/png",

                    data:
                        base64Data

                }

            });

        }

    }

    /* USER PROMPT */

    if (prompt) {

        parts.push({

            text:
                prompt

        });

    }

    if (parts.length) {

        contents.push({

            role: "user",

            parts

        });

    }

    return contents;

}

/* =========================================================
   GENERIC TEXT/CODE MODEL REQUEST WITH FALLBACK
========================================================= */

async function generateWithModelFallback({
    systemInstruction,
    prompt,
    file,
    conversation,
    mode
}) {

    const contents =
        buildContents({
            prompt,
            file,
            conversation
        });

    let lastError = null;

    for (
        const model
        of TEXT_MODELS
    ) {

        try {

            console.log(
                `Trying ${model} for ${mode}...`
            );

            const response =
                await ai.models.generateContent({

                    model,

                    contents,

                    config: {

                        systemInstruction,

                        thinkingConfig: {

                            thinkingLevel:
                                mode === "code"
                                    ? "high"
                                    : "medium"

                        }

                    }

                });

            const text =
                response.text ||
                extractTextFromResponse(
                    response
                );

            if (!text) {

                throw new Error(
                    `${model} returned an empty response.`
                );

            }

            console.log(
                `SUCCESS: ${model}`
            );

            return {

                success: true,

                type: mode,

                text,

                model

            };

        } catch (error) {

            lastError = error;

            console.error(
                `${model} failed:`,
                error?.message ||
                error
            );

            if (
                !isTemporaryModelError(error)
            ) {

                throw error;

            }

            console.log(
                `${model} is temporarily unavailable. Trying next model...`
            );

        }

    }

    throw lastError ||
        new Error(
            "All Gemini text models failed."
        );

}

/* =========================================================
   TEXT
========================================================= */

async function generateText({
    prompt,
    file,
    conversation
}) {

    return generateWithModelFallback({

        systemInstruction:
            TEXT_SYSTEM_INSTRUCTION,

        prompt,

        file,

        conversation,

        mode:
            "text"

    });

}

/* =========================================================
   CODE
========================================================= */

async function generateCode({
    prompt,
    file,
    conversation
}) {

    return generateWithModelFallback({

        systemInstruction:
            CODE_SYSTEM_INSTRUCTION,

        prompt,

        file,

        conversation,

        mode:
            "code"

    });

}

/* =========================================================
   IMAGE GENERATION
========================================================= */

async function generateImage({
    prompt,
    file
}) {

    const parts = [];

    /* ---------------------------------------------
       UPLOADED IMAGE
    --------------------------------------------- */

    if (file?.data) {

        const base64Data =
            extractBase64(file.data);

        if (base64Data) {

            parts.push({

                inlineData: {

                    mimeType:
                        file.type ||
                        "image/png",

                    data:
                        base64Data

                }

            });

        }

    }

    /* ---------------------------------------------
       PROMPT
    --------------------------------------------- */

    parts.push({

        text:
            prompt ||
            "Create a high-quality image based on the uploaded reference."

    });

    console.log(
        `Trying ${IMAGE_MODEL} for image generation...`
    );

    const response =
        await ai.models.generateContent({

            model:
                IMAGE_MODEL,

            contents: [

                {

                    role:
                        "user",

                    parts

                }

            ],

            config: {

                systemInstruction:
                    IMAGE_SYSTEM_INSTRUCTION,

                responseModalities: [
                    "TEXT",
                    "IMAGE"
                ],

                responseFormat: {

                    image: {

                        aspectRatio:
                            "1:1",

                        imageSize:
                            "1K"

                    }

                }

            }

        });

    let imageData = null;

    let mimeType =
        "image/png";

    let text = "";

    const candidates =
        response?.candidates ||
        [];

    for (
        const candidate
        of candidates
    ) {

        const responseParts =
            candidate?.content?.parts ||
            [];

        for (
            const part
            of responseParts
        ) {

            /* IMAGE */

            if (
                part?.inlineData?.data
            ) {

                imageData =
                    part.inlineData.data;

                mimeType =
                    part.inlineData.mimeType ||
                    "image/png";

            }

            /* TEXT */

            if (
                part?.text
            ) {

                text +=
                    part.text;

            }

        }

    }

    if (!imageData) {

        throw new Error(
            "Gemini completed the image request but did not return an image."
        );

    }

    console.log(
        "SUCCESS: Image generated"
    );

    return {

        success: true,

        type:
            "image",

        image:
            `data:${mimeType};base64,${imageData}`,

        text:
            text.trim(),

        model:
            IMAGE_MODEL

    };

}

/* =========================================================
   RESPONSE TEXT
========================================================= */

function extractTextFromResponse(
    response
) {

    let text = "";

    const candidates =
        response?.candidates ||
        [];

    for (
        const candidate
        of candidates
    ) {

        const parts =
            candidate?.content?.parts ||
            [];

        for (
            const part
            of parts
        ) {

            if (
                part?.text
            ) {

                text +=
                    part.text;

            }

        }

    }

    return text.trim();

}

/* =========================================================
   BASE64
========================================================= */

function extractBase64(data) {

    if (!data) {
        return null;
    }

    if (
        !data.startsWith("data:")
    ) {

        return data;

    }

    const commaIndex =
        data.indexOf(",");

    if (
        commaIndex === -1
    ) {

        return null;

    }

    return data.slice(
        commaIndex + 1
    );

}

/* =========================================================
   TEMPORARY ERROR DETECTION
========================================================= */

function isTemporaryModelError(
    error
) {

    const status =
        error?.status ||
        error?.statusCode ||
        error?.code;

    const message =
        (
            error?.message ||
            String(error)
        ).toLowerCase();

    return (

        status === 429 ||

        status === 500 ||

        status === 502 ||

        status === 503 ||

        status === 504 ||

        message.includes(
            "high demand"
        ) ||

        message.includes(
            "temporarily unavailable"
        ) ||

        message.includes(
            "service unavailable"
        ) ||

        message.includes(
            "unavailable"
        ) ||

        message.includes(
            "resource exhausted"
        ) ||

        message.includes(
            "rate limit"
        )

    );

}

/* =========================================================
   READABLE ERROR
========================================================= */

function getReadableError(
    error
) {

    const message =
        error?.message ||
        String(error);

    const status =
        error?.status ||
        error?.statusCode ||
        error?.code;

    console.error(
        "Gemini error status:",
        status
    );

    console.error(
        "Gemini error message:",
        message
    );

    if (
        message.toLowerCase()
            .includes("api key")
    ) {

        return (
            "Gemini API authentication failed. " +
            "Check your GEMINI_API_KEY."
        );

    }

    if (
        message.includes(
            "PERMISSION_DENIED"
        ) ||
        message.includes("403")
    ) {

        return (
            "Gemini rejected the request. " +
            "Check your API key and Google AI Studio project access."
        );

    }

    if (
        message.includes(
            "quota"
        ) ||
        message.includes(
            "RESOURCE_EXHAUSTED"
        )
    ) {

        return (
            "The Gemini API quota is exhausted. No alternate model was used. " +
            "Wait for the quota to reset, then try again."
        );

    }

    if (
        status === 503 ||
        message.toLowerCase()
            .includes("high demand")
    ) {

        return (
            "Gemini is temporarily experiencing high demand. " +
            "The application tried its available fallback models, " +
            "but they were unavailable as well. Please try again shortly."
        );

    }

    if (
        status === 429
    ) {

        return (
            "Gemini is temporarily rate-limiting requests. " +
            "Please try again shortly."
        );

    }

    return message;

}

/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.use((req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});

/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    HOST,
    () => {

        console.log(`
╔══════════════════════════════════════════╗
║          AI SECOND BRAIN                ║
║          Backend is running             ║
╚══════════════════════════════════════════╝

Local application:
http://localhost:${PORT}

Network application:
http://0.0.0.0:${PORT}

API:
http://localhost:${PORT}/api/generate

Health:
http://localhost:${PORT}/api/health

Text/Code primary model:
gemini-3.8-flash

Text/Code fallback models:
gemini-3.7-flash
gemini-3.6-flash
gemini-3.5-flash

Image model:
gemini-3.1-flash-image
`);

    }
);