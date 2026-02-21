// app/api/agent/route.ts
// 🤖 OPENAI AGENT API - INFRASTRUCTURE GRADE

import { NextRequest, NextResponse } from 'next/server';
import { openai, OPENAI_CONFIG, AGENT_SYSTEM_PROMPT } from '@/lib/openai/client';
import {
  eventIntelToolDefinition,
  executeEventSearch
} from '@/lib/tools/eventIntelTool';
import {
  hotelSearchToolDefinition,
  executeHotelSearch
} from '@/lib/tools/travelpayoutsHotelTool';
import {
  flightSearchToolDefinition,
  executeFlightSearch
} from '@/lib/tools/travelpayoutsFlightTool';

// Tool registry
const TOOLS = [
  eventIntelToolDefinition,
  hotelSearchToolDefinition,
  flightSearchToolDefinition
];

function buildUserMessage(message: string, context: any) {
  return `
User message:
${message}

Context:
${JSON.stringify(context || {}, null, 2)}

Return STRICT JSON only.
`;
}

function safeJSONParse(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🧠 Agent received:', message);

    const userPayload = buildUserMessage(message, context);

    // =========================
    // PHASE 1: Initial tool call detection
    // =========================
    const initialCompletion = await openai.chat.completions.create({
      ...OPENAI_CONFIG,
      messages: [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: userPayload }
      ],
      tools: TOOLS,
      tool_choice: 'auto'
    });

    const initialMessage = initialCompletion.choices[0].message;

    // =========================
    // PHASE 2: Execute tools if requested
    // =========================
    if (initialMessage.tool_calls?.length) {
  const toolNames = initialMessage.tool_calls
    .filter(
      (t): t is typeof t & { type: 'function' } =>
        t.type === 'function'
    )
    .map(t => t.function.name);

  console.log('🔧 Executing tools:', toolNames);


      const toolResults = await Promise.all(
        initialMessage.tool_calls.map(async (toolCall) => {
  if (toolCall.type !== 'function') {
    return {
      tool_call_id: toolCall.id,
      role: 'tool' as const,
      name: 'unknown',
      content: JSON.stringify({ error: 'Unsupported tool type' })
    };
  }

  const functionName = toolCall.function.name;
  const functionArgs =
    safeJSONParse(toolCall.function.arguments || '{}') || {};


          let result: any = {};

          try {
            switch (functionName) {
              case 'search_events':
                result = await executeEventSearch(functionArgs);
                break;
              case 'search_hotels':
                result = await executeHotelSearch(functionArgs);
                break;
              case 'search_flights':
                result = await executeFlightSearch(functionArgs);
                break;
              default:
                result = { error: 'Unknown tool' };
            }
          } catch (toolError: any) {
            console.error(`❌ Tool error (${functionName}):`, toolError);
            result = { error: toolError.message || 'Tool execution failed' };
          }

          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            name: functionName,
            content: JSON.stringify(result)
          };
        })
      );

      // =========================
      // PHASE 3: Final completion with tool results
      // =========================
      const finalCompletion = await openai.chat.completions.create({
        ...OPENAI_CONFIG,
        messages: [
          { role: 'system', content: AGENT_SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
          initialMessage,
          ...toolResults
        ],
        response_format: { type: 'json_object' }
      });

      const finalContent = finalCompletion.choices[0].message.content;

      if (!finalContent) {
        throw new Error('No response from OpenAI');
      }

      const parsedResponse = safeJSONParse(finalContent);

      if (!parsedResponse) {
        throw new Error('Invalid JSON returned from OpenAI');
      }

      console.log('✅ Agent response ready (with tools)');

      return NextResponse.json({
        success: true,
        data: parsedResponse,
        usage: finalCompletion.usage
      });
    }

    // =========================
    // PHASE 4: No tools required
    // =========================
    const directContent = initialMessage.content;

    if (!directContent) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = safeJSONParse(directContent);

    if (!parsedResponse) {
      throw new Error('Invalid JSON returned from OpenAI');
    }

    console.log('✅ Agent response ready (no tools)');

    return NextResponse.json({
      success: true,
      data: parsedResponse,
      usage: initialCompletion.usage
    });

  } catch (error: any) {
    console.error('❌ Agent error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Agent processing failed',
        data: {
          intent: 'information_only',
          destination: { city: null, country: null },
          event: { name: null, type: null, date: null, venue: null },
          itinerary: [],
          hotels: [],
          flights: [],
          affiliate_links: { hotel: '', flight: '', tickets: '' },
          upsells: { insurance: false, esim: false },
          message: 'Agent execution fallback triggered.'
        }
      },
      { status: 500 }
    );
  }
}
