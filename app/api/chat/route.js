require('dotenv').config();

import { NextResponse } from "next/server"
const { GoogleGenerativeAI } = require("@google/generative-ai")

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("API key is missing!");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are a Personal Health Assistant AI designed to help users monitor and improve their health and wellness. Your tasks include tracking health metrics, providing personalized wellness advice, reminding users of medications and appointments, suggesting healthy habits, and offering tips for a balanced lifestyle. You should communicate in a friendly, empathetic, and supportive manner, always prioritizing the user's well-being. Your responses should be clear, actionable, and tailored to the user's individual needs and preferences.",
})

async function startChat(history) {
    return model.startChat({
        history: history,
        generationConfig: { 
            maxOutputTokens: 8000,
        },
    })
}

export async function POST(req) {
    const history = await req.json() || [];
    if (!history.length) {
        return NextResponse.json({text: "No history provided."});
    }
    const userMsg = history[history.length - 1];

    try {
        const chat = await startChat(history)

        const result = await chat.sendMessageStream(userMsg.parts[0].text);

        // Stream the response back to the client
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    controller.enqueue(encoder.encode(chunkText));
                }
                controller.close();
            }
        });

        return new NextResponse(readableStream, {
            headers: { "Content-Type": "text/event-stream" }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ text: "error, check console" });
    }

}

/*
const data = await req.json()

    // Combine the system prompt and user data to form the prompt
    const prompt = [{ role: 'system', content: systemPrompt }, ...data];


    // Generate content using the model, with streaming enabled
    const result = await model.generateContentStream(prompt);
    console.log(result.response.text())

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
        const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array

        try {
            // Iterate over the streamed chunks of the response
            for await (const chunk of result.stream) {
            const chunkText = chunk.text; // Extract the text from the chunk
            if (chunkText) {
                const encodedText = encoder.encode(chunkText); // Encode the text to Uint8Array
                controller.enqueue(encodedText); // Enqueue the encoded text to the stream
            }
            }
        } catch (err) {
            controller.error(err); // Handle any errors that occur during streaming
        } finally {
            controller.close(); // Close the stream when done
        }
        },
    });

    // Return the stream as the response
    return new NextResponse(stream);*/