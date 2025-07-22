import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '2026295',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '52c49fd01c55c8dd93a1',
  secret: process.env.PUSHER_SECRET || 'b6e5e95f689837c5d011',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || '52c49fd01c55c8dd93a1',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  }
) 