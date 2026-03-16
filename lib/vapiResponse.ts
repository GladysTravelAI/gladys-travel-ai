import { NextResponse } from 'next/server'

// Standard response format Vapi expects from tool calls
export function toolSuccess(result: Record<string, unknown>) {
  return NextResponse.json({ result })
}

export function toolError(message: string) {
  return NextResponse.json({ error: message }, { status: 200 }) // 200 so Vapi reads it
}