import { OPENAI_KEY } from '$env/static/private'
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request }){
    try {
        if (!OPENAI_KEY) {
            throw new Error('OPENAI_KEY env variable not set')
        }

        //If the request body has no data throw an error
        const requestData = await request.json()

        if (!requestData) {
            throw new Error('No request data')
        }

        //save an array of messages for the client
        const reqMessages: ChatCompletionRequestMessage[] = requestData.messages

        if (!reqMessages) {
            throw new Error('no messages provided')
        }

        let tokenCount = 0

        //Tokenize the message and check how many tokens a message is in case it exceeds the limit of the call
        reqMessages.forEach((msg) => {
            const tokens = getTokens(msg.content)
            tokenCount += tokens
        })

        //Create a POST request to openai Moderation Endpoint
        //The input will be the last message in the array of reqMessages
        const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_KEY}`
            },
            method: 'POST',
            body: JSON.stringify({
                input: reqMessages[reqMessages.length - 1].content
            })
        })
        if (!moderationRes.ok) {
            const err = await moderationRes.json()
            throw new Error(err.error.message)
        }

        const moderationData = await moderationRes.json()
        const [results] = moderationData.results

        if (results.flagged) {
            throw new Error('Query flagged by openai')
        }

        //Initial Prompt
        const prompt =
            'You are a virtual assistant for a company called Mosaed. Your name is Mohammed. The company offers a platform' +
            ' for whistleblowers to report any corruption in an organization. You are based in the middle east.'
        tokenCount += getTokens(prompt)

        //If it exceeds token count throw an error
        if (tokenCount >= 4000) {
            throw new Error('Query too large')
        }

        //Define starting prompt and the rest of the user request (message)
        const messages: ChatCompletionRequestMessage[] = [
            { role: 'system', content: prompt },
            ...reqMessages
        ]

        //Create a GPT agent using 3.5 turbo and temperature of 0.9 (Play around with the temperature) Maybe user GPT 4?
        const chatRequestOpts: CreateChatCompletionRequest = {
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.9,
            stream: true
        }

        //Create a POST request to the chat completions API endpoint.
        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            headers: {
                Authorization: `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(chatRequestOpts)
        })

        if (!chatResponse.ok) {
            const err = await chatResponse.json()
            throw new Error(err.error.message)
        }

        return new Response(chatResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
            }
        })

    } catch (err) {
        console.error(err)
        return json({ error: 'There was an error processing your request' }, { status: 500 })
    }
}