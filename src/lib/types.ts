export interface Product {
  image_url: string
  price: number | null
  description: string
}

export interface CartItem {
  product_id?: string | null
  price: number | null
  quantity: number
  currency: string
  product_image_url: string
  total_price: number | null
}

export interface ChatResponse {
  request_id: string
  answer: string
  used_context: Product[]
  trace_id?: string | null
  shopping_cart?: CartItem[]
}

export type MessageStatus = 'loading' | 'complete' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  status: MessageStatus
  error?: string
  createdAt: number
}

export interface PersistedChat {
  threadId: string
  messages: ChatMessage[]
  cart: CartItem[]
}

export type ApiStatus = 'checking' | 'online' | 'offline'
