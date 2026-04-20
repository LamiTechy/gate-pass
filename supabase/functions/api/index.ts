import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { v4 as uuidv4 } from "https://deno.land/std@0.208.0/uuid/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false
  return bcrypt.compareSync(password, hash)
}

function createToken(): string {
  return uuidv4()
}

async function getCurrentUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  if (!token) return null
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('token', token)
    .single()
  
  return error ? null : data
}

function mapEvent(row: any) {
  if (!row) return null
  return {
    ...row,
    allow_plus_one: !!row.allow_plus_one,
    registration_open: !!row.registration_open,
  }
}

function mapGuest(row: any) {
  if (!row) return null
  return {
    ...row,
    plus_one_count: row.plus_one_count,
    entries_used: row.entries_used,
  }
}

async function handleAuthRegister(body: any) {
  const { email, password, name } = body
  if (!email || !password || !name) {
    return new Response(
      JSON.stringify({ error: 'Name, email, and password are required.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'An account with this email already exists.' }),
      { status: 409, headers: corsHeaders }
    )
  }

  const id = uuidv4()
  const token = createToken()
  const hash = hashPassword(password)
  const createdAt = Date.now()

  const { error } = await supabase
    .from('users')
    .insert([
      {
        id,
        email: email.toLowerCase(),
        password_hash: hash,
        name,
        token,
        created_at: createdAt,
      },
    ])

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }

  return new Response(
    JSON.stringify({ user: { id, email: email.toLowerCase(), name }, token }),
    { status: 201, headers: corsHeaders }
  )
}

async function handleAuthLogin(body: any) {
  const { email, password } = body
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password are required.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { data: user, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (selectError || !user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email or password.' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const token = createToken()
  await supabase
    .from('users')
    .update({ token })
    .eq('id', user.id)

  return new Response(
    JSON.stringify({ user: { id: user.id, email: user.email, name: user.name }, token }),
    { status: 200, headers: corsHeaders }
  )
}

async function handleAuthMe(authHeader: string | null) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }
  return new Response(JSON.stringify({ user }), { status: 200, headers: corsHeaders })
}

async function handleGetEvents(authHeader: string | null) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: rows, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify(rows.map(mapEvent)),
    { status: 200, headers: corsHeaders }
  )
}

async function handleCreateEvent(authHeader: string | null, body: any) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { name, description, date, location, max_guests, allow_plus_one, plus_one_limit } = body
  if (!name || !date) {
    return new Response(
      JSON.stringify({ error: 'Event name and date are required.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const id = uuidv4()
  const createdAt = Date.now()

  const { error } = await supabase
    .from('events')
    .insert([
      {
        id,
        host_id: user.id,
        name,
        description: description || null,
        date,
        location: location || null,
        max_guests: max_guests || null,
        allow_plus_one: allow_plus_one ? 1 : 0,
        plus_one_limit: plus_one_limit || 0,
        registration_open: 1,
        created_at: createdAt,
      },
    ])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify(
      mapEvent({
        id,
        host_id: user.id,
        name,
        description,
        date,
        location,
        max_guests,
        allow_plus_one: allow_plus_one ? 1 : 0,
        plus_one_limit: plus_one_limit || 0,
        registration_open: 1,
        created_at: createdAt,
      })
    ),
    { status: 201, headers: corsHeaders }
  )
}

async function handleGetEvent(eventId: string) {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return new Response(
      JSON.stringify({ error: 'Event not found.' }),
      { status: 404, headers: corsHeaders }
    )
  }
  return new Response(JSON.stringify(mapEvent(event)), { status: 200, headers: corsHeaders })
}

async function handleUpdateEvent(authHeader: string | null, eventId: string, body: any) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (fetchError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Event not found or access denied.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const updates: any = {}
  const allowed = ['name', 'description', 'date', 'location', 'max_guests', 'allow_plus_one', 'plus_one_limit', 'registration_open']
  
  allowed.forEach((field) => {
    if (body[field] !== undefined) {
      updates[field] = field === 'allow_plus_one' || field === 'registration_open' ? (body[field] ? 1 : 0) : body[field]
    }
  })

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify(mapEvent(event)), { status: 200, headers: corsHeaders })
  }

  const { error: updateError } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders })
  }

  const { data: updated } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  return new Response(JSON.stringify(mapEvent(updated)), { status: 200, headers: corsHeaders })
}

async function handleDeleteEvent(authHeader: string | null, eventId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (fetchError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Event not found or access denied.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  await supabase.from('entry_logs').delete().eq('event_id', eventId)
  await supabase.from('guests').delete().eq('event_id', eventId)
  await supabase.from('events').delete().eq('id', eventId)

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
}

async function handleGetEventStats(authHeader: string | null, eventId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Event not found or access denied.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { count: totalGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const { count: checkedIn } = await supabase
    .from('entry_logs')
    .select('guest_id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const { count: validPasses } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'valid')

  const { count: usedPasses } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'used')

  const { count: revokedPasses } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'revoked')

  return new Response(
    JSON.stringify({
      totalGuests: totalGuests || 0,
      checkedIn: checkedIn || 0,
      validPasses: validPasses || 0,
      usedPasses: usedPasses || 0,
      revokedPasses: revokedPasses || 0,
    }),
    { status: 200, headers: corsHeaders }
  )
}

async function handleGetEventGuests(authHeader: string | null, eventId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Event not found or access denied.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { data: rows, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify(rows.map(mapGuest)),
    { status: 200, headers: corsHeaders }
  )
}

async function handleGetEventLogs(authHeader: string | null, eventId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Event not found or access denied.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { data: rows, error } = await supabase
    .from('entry_logs')
    .select('*, guests(name, email)')
    .eq('event_id', eventId)
    .order('scanned_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify(rows),
    { status: 200, headers: corsHeaders }
  )
}

async function handleRegisterGuest(eventId: string, body: any, req: Request) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event || event.registration_open !== 1) {
    return new Response(
      JSON.stringify({ error: 'Registration is closed or event not found.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { name, email, plus_one_count } = body
  const plusOneCount = Number(plus_one_count || 0)

  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Guest name is required.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  if (!event.allow_plus_one && plusOneCount > 0) {
    return new Response(
      JSON.stringify({ error: 'Plus-ones are not allowed for this event.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  if (plusOneCount > event.plus_one_limit) {
    return new Response(
      JSON.stringify({ error: 'The chosen plus-one count exceeds the event limit.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { count: currentCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const requestedCount = 1 + plusOneCount
  if (event.max_guests && (currentCount || 0) + requestedCount > event.max_guests) {
    return new Response(
      JSON.stringify({ error: 'This event has reached its guest limit.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const guestId = uuidv4()
  const qrToken = `${uuidv4()}-${uuidv4()}`
  const createdAt = Date.now()
  const origin = new URL(req.url).origin
  const qrUrl = `${origin}/verify/${qrToken}`

  const { error: insertError } = await supabase
    .from('guests')
    .insert([
      {
        id: guestId,
        event_id: eventId,
        name,
        email: email || null,
        qr_token: qrToken,
        status: 'valid',
        plus_one_count: plusOneCount,
        entries_used: 0,
        created_at: createdAt,
      },
    ])

  if (insertError) {
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500, headers: corsHeaders }
    )
  }

  return new Response(
    JSON.stringify({
      guest: mapGuest({
        id: guestId,
        event_id: eventId,
        name,
        email: email || null,
        qr_token: qrToken,
        status: 'valid',
        plus_one_count: plusOneCount,
        entries_used: 0,
        created_at: createdAt,
        first_used_at: null,
      }),
      qrUrl,
    }),
    { status: 201, headers: corsHeaders }
  )
}

async function handleVerifyGuest(body: any) {
  const { token } = body
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Token is required.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('*')
    .eq('qr_token', token)
    .single()

  if (guestError || !guest) {
    return new Response(
      JSON.stringify({ error: 'Invalid pass. This code does not match our records.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', guest.event_id)
    .single()

  const eventName = event?.name || 'Unknown Event'

  if (guest.status === 'revoked') {
    return new Response(
      JSON.stringify({
        success: false,
        guest: mapGuest(guest),
        eventName,
        message: 'This pass has been revoked.',
      }),
      { status: 400, headers: corsHeaders }
    )
  }

  const entriesAllowed = 1 + guest.plus_one_count
  const entriesUsed = guest.entries_used
  if (entriesUsed >= entriesAllowed) {
    return new Response(
      JSON.stringify({
        success: false,
        guest: mapGuest(guest),
        eventName,
        message: `Already checked in. All ${entriesAllowed} entries used.`,
        entriesAllowed,
        entriesUsed,
        firstUse: false,
      }),
      { status: 400, headers: corsHeaders }
    )
  }

  const isFirstUse = entriesUsed === 0
  const newEntriesUsed = entriesUsed + 1
  const newStatus = newEntriesUsed >= entriesAllowed ? 'used' : 'valid'
  const now = Date.now()

  await supabase
    .from('guests')
    .update({
      entries_used: newEntriesUsed,
      status: newStatus,
      first_used_at: guest.first_used_at || now,
    })
    .eq('id', guest.id)

  await supabase
    .from('entry_logs')
    .insert([
      {
        id: uuidv4(),
        guest_id: guest.id,
        event_id: guest.event_id,
        scanned_at: now,
        status: newStatus,
        entries_count: 1,
      },
    ])

  return new Response(
    JSON.stringify({
      success: true,
      guest: mapGuest({ ...guest, entries_used: newEntriesUsed, status: newStatus }),
      eventName,
      message: isFirstUse ? 'First entry verified!' : `Entry ${newEntriesUsed} of ${entriesAllowed} verified!`,
      entriesAllowed,
      entriesUsed: newEntriesUsed,
      firstUse: isFirstUse,
    }),
    { status: 200, headers: corsHeaders }
  )
}

async function handleRevokeGuest(authHeader: string | null, guestId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single()

  if (guestError || !guest) {
    return new Response(
      JSON.stringify({ error: 'Guest not found.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', guest.event_id)
    .single()

  if (eventError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Access denied.' }),
      { status: 403, headers: corsHeaders }
    )
  }

  await supabase
    .from('guests')
    .update({ status: 'revoked' })
    .eq('id', guestId)

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
}

async function handleRestoreGuest(authHeader: string | null, guestId: string) {
  const user = await getCurrentUser(authHeader)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    )
  }

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single()

  if (guestError || !guest) {
    return new Response(
      JSON.stringify({ error: 'Guest not found.' }),
      { status: 404, headers: corsHeaders }
    )
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', guest.event_id)
    .single()

  if (eventError || !event || event.host_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Access denied.' }),
      { status: 403, headers: corsHeaders }
    )
  }

  const entriesAllowed = 1 + guest.plus_one_count
  const status = guest.entries_used >= entriesAllowed ? 'used' : 'valid'

  await supabase
    .from('guests')
    .update({ status })
    .eq('id', guestId)

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const pathname = url.pathname
  const method = req.method
  const authHeader = req.headers.get('authorization')

  let body: any = null
  if (method !== 'GET') {
    try {
      body = await req.json()
    } catch (_e) {
      // No body
    }
  }

  // Auth routes
  if (pathname === '/api/auth/register' && method === 'POST') {
    return await handleAuthRegister(body)
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    return await handleAuthLogin(body)
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    return await handleAuthMe(authHeader)
  }

  // Events routes
  if (pathname === '/api/events' && method === 'GET') {
    return await handleGetEvents(authHeader)
  }
  if (pathname === '/api/events' && method === 'POST') {
    return await handleCreateEvent(authHeader, body)
  }

  const eventMatch = pathname.match(/^\/api\/events\/([^\/]+)$/)
  if (eventMatch) {
    const eventId = eventMatch[1]
    if (method === 'GET') {
      return await handleGetEvent(eventId)
    }
    if (method === 'PUT') {
      return await handleUpdateEvent(authHeader, eventId, body)
    }
    if (method === 'DELETE') {
      return await handleDeleteEvent(authHeader, eventId)
    }
  }

  const statsMatch = pathname.match(/^\/api\/events\/([^\/]+)\/stats$/)
  if (statsMatch && method === 'GET') {
    return await handleGetEventStats(authHeader, statsMatch[1])
  }

  const guestsMatch = pathname.match(/^\/api\/events\/([^\/]+)\/guests$/)
  if (guestsMatch && method === 'GET') {
    return await handleGetEventGuests(authHeader, guestsMatch[1])
  }
  if (guestsMatch && method === 'POST') {
    return await handleRegisterGuest(guestsMatch[1], body, req)
  }

  const logsMatch = pathname.match(/^\/api\/events\/([^\/]+)\/logs$/)
  if (logsMatch && method === 'GET') {
    return await handleGetEventLogs(authHeader, logsMatch[1])
  }

  // Guest routes
  if (pathname === '/api/guests/verify' && method === 'POST') {
    return await handleVerifyGuest(body)
  }

  const revokeMatch = pathname.match(/^\/api\/guests\/([^\/]+)\/revoke$/)
  if (revokeMatch && method === 'POST') {
    return await handleRevokeGuest(authHeader, revokeMatch[1])
  }

  const restoreMatch = pathname.match(/^\/api\/guests\/([^\/]+)\/restore$/)
  if (restoreMatch && method === 'POST') {
    return await handleRestoreGuest(authHeader, restoreMatch[1])
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: corsHeaders }
  )
})
