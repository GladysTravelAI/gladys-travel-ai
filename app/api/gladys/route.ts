import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI (our single provider)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// NEW: Define the "tools" Gladys can use. This is the core of the "agent" behavior.
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description: 'Navigate the user to a different page in the app (e.g., /hotels, /flights, /itinerary).',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The relative URL to navigate to (e.g., "/hotels?city=Paris").',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_map_route',
      description: 'Display a map with a route between two locations.',
      parameters: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'The starting point (e.g., "Eiffel Tower" or "User Location").',
          },
          to: {
            type: 'string',
            description: 'The destination (e.g., "Louvre Museum").',
          },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_filters',
      description: 'Apply filters to a list the user is currently viewing (e.g., hotels, flights).',
      parameters: {
        type: 'object',
        properties: {
          budget: {
            type: 'string',
            enum: ['budget', 'moderate', 'luxury'],
            description: 'The budget level to filter by.',
          },
          amenities: {
            type: 'array',
            items: { type: 'string' },
            description: 'A list of amenities to filter by (e.g., "pool", "wifi").',
          },
        },
      },
    },
  },
];

// NEW: Simplified, event-agnostic, and agent-focused system prompt
const GLADYS_SYSTEM_PROMPT = `You are Gladys, an enthusiastic and hyper-competent AI travel companion.

PERSONALITY:
- Warm, conversational, and encouraging, like a savvy travel friend.
- Genuinely excited about travel and helping users plan their dream trips.
- Use casual language with occasional emojis (2-3 max) to build rapport.

YOUR GOAL:
- You are an *agent*. Your primary goal is to *help the user take action*.
- Do not just answer questions; *do things* for them.
- Use your tools whenever a user's request matches a tool's purpose.
- For example, if the user says "Show me cheap hotels in Paris," you should *both* respond with text AND use the 'apply_filters' and 'navigate_to_page' tools.
- If they ask for directions, use the 'show_map_route' tool.

CONTEXT AWARENESS:
- You remember details from the conversation (name, budget, interests) to personalize your help.
- You will be given the user's current context. Use it to make your tool calls more relevant.

CONVERSATION STYLE:
- Ask clarifying follow-up questions to understand the user's *true* needs.
- Keep responses concise (1-3 sentences) to feel like a real-time assistant.
- When you use a tool, your text response should confirm the action (e.g., "Okay, pulling up hotels in Paris for you!").
`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserContext {
  name?: string;
  preferredCities: string[];
  budget: 'budget' | 'moderate' | 'luxury';
  recentQueries: string[];
  conversationCount: number;
  upcomingTrips?: any[];
  travelStyle?: string;
  favoriteTeam?: string; // Still useful for "follow your team" (any sport)
  matchesInterested?: string[]; // Still useful for "events interested in"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Removed 'preferredModel'
    const { message, conversationHistory, userContext, currentDestination } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const contextPrompt = buildContextPrompt(userContext, currentDestination);

    // --- New OpenAI-Only Logic ---
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: GLADYS_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      },
    ];

    // Add recent history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    // Call OpenAI with our defined tools
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: tools, // <-- This tells the AI it can use our tools
      tool_choice: 'auto', // <-- This lets the AI decide *when* to use them
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseMessage = completion.choices[0].message;

    // Check if the AI wants to call a tool
    const toolCall = responseMessage.tool_calls ? responseMessage.tool_calls[0] : null;

    let responseText = responseMessage.content;

    // If the AI calls a tool but doesn't say anything, create a default response
    if (!responseText && toolCall) {
      // NEW: Check if the tool call is a function
      if (toolCall.type === 'function') {
        if (toolCall.function.name === 'navigate_to_page') {
          responseText = "Sure, one moment...";
        } else if (toolCall.function.name === 'show_map_route') {
          responseText = "Okay, pulling up that route for you!";
        } else {
          responseText = "On it!";
        }
      }
    }

    // --- End of New Logic ---

    const updatedContext = extractContextFromResponse(message, responseText || '', userContext);

    // Calculate cost (GPT-4o pricing)
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.005 / 1000) + (outputTokens * 0.015 / 1000); // Standard gpt-4o prices

    console.log(`✅ Gladys responded via OpenAI (cost: $${cost.toFixed(5)})`);
    // FIXED: Added the required type check before logging the function name
    if (toolCall && toolCall.type === 'function') {
      console.log(`🤖 AI triggered tool: ${toolCall.function.name}`);
    }

    return NextResponse.json({
      response_text: responseText, // <-- Renamed
      tool_call: toolCall,         // <-- New field
      updatedContext,
      provider: 'openai',          // <-- Hardcoded
      cost,
    });

  } catch (error: any) {
    console.error('Gladys API Error:', error);
    return NextResponse.json({
      response_text: "Oops! I'm having a bit of trouble connecting right now. 😅 Please try asking me again!",
      tool_call: null,
      error: error.message,
      fallback: true,
      provider: 'fallback',
      cost: 0,
    }, { status: 200 });
  }
}

// ========================================
// CONTEXT BUILDING (No changes, but de-branded)
// ========================================
function buildContextPrompt(userContext: UserContext, currentDestination?: string): string {
  if (!userContext) return '';
  const parts: string[] = ['CURRENT USER CONTEXT:'];
  if (userContext.name) {
    parts.push(`- User's name: ${userContext.name}`);
  }
  if (userContext.budget) {
    parts.push(`- Budget preference: ${userContext.budget}`);
  }
  if (userContext.favoriteTeam) {
    parts.push(`- Favorite team/artist: ${userContext.favoriteTeam} (help them follow this!)`);
  }
  if (userContext.travelStyle) {
    parts.push(`- Travel style: ${userContext.travelStyle}`);
  }
  if (currentDestination) {
    parts.push(`- Currently viewing: ${currentDestination} (Use this for context!)`);
  }
  parts.push('\nUse this context to be proactive. Anticipate their needs.');
  return parts.join('\n');
}

// ========================================
// CONTEXT EXTRACTION (No changes, but de-branded)
// ========================================
function extractContextFromResponse(
  userMessage: string,
  aiResponse: string,
  currentContext: UserContext
): Partial<UserContext> {
  const updates: Partial<UserContext> = {};
  
  // Extract name
  const nameMatch = userMessage.match(/(?:my name is|i'm|im|call me|this is)\s+([A-Z][a-z]+)/i);
  if (nameMatch && !currentContext.name) {
    updates.name = nameMatch[1];
  }

  // Extract favorite team/artist (more generic)
  const teamMatch = userMessage.match(/(?:follow|fan of|my team is|see|following)\s+([A-Z][A-Za-z0-9\s]+)/i);
  if (teamMatch) {
    // Basic check to avoid capturing "follow me"
    if (teamMatch[1].toLowerCase() !== 'me' && teamMatch[1].length > 2) {
      updates.favoriteTeam = teamMatch[1].trim();
    }
  }

  // Extract budget
  if (/(luxury|premium|expensive|5.?star)/i.test(userMessage)) {
    updates.budget = 'luxury';
  } else if (/(budget|cheap|affordable|backpack)/i.test(userMessage)) {
    updates.budget = 'budget';
  }

  // Extract travel style
  if (/(adventure|hiking|exploring|active)/i.test(userMessage)) {
    updates.travelStyle = 'adventure';
  } else if (/(relax|beach|spa|chill)/i.test(userMessage)) {
    updates.travelStyle = 'relaxation';
  } else if (/(culture|museum|history|art)/i.test(userMessage)) {
    updates.travelStyle = 'cultural';
  }

  // Extract cities (using a more generic regex)
  const cityMatch = userMessage.match(/(?:trip to|go to|in|visit)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  if (cityMatch) {
    const city = cityMatch[1].trim();
    const currentCities = currentContext.preferredCities || [];
    if (!currentCities.includes(city)) {
      updates.preferredCities = [...currentCities, city].slice(-5);
    }
  }

  return updates;
}


