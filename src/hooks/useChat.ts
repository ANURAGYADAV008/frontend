import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, sendChat } from '../lib/api'
import { createId, createThreadId, loadChat, saveChat } from '../lib/storage'
import type { CartItem, ChatMessage } from '../lib/types'

export function useChat() {
  const [savedChat] = useState(loadChat)
  const [threadId, setThreadId] = useState(
    () => savedChat?.threadId ?? createThreadId(),
  )
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => savedChat?.messages ?? [],
  )
  const [cart, setCart] = useState<CartItem[]>(() => savedChat?.cart ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null)

  const requestSeq = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (isLoading) return
    saveChat({ threadId, messages, cart })
  }, [threadId, messages, cart, isLoading])

  const runRequest = useCallback(
    async (query: string) => {
      const seq = ++requestSeq.current
      const controller = new AbortController()
      const assistantId = createId()

      abortRef.current = controller
      setIsLoading(true)
      setMessages((previous) => [
        ...previous,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          status: 'loading',
          createdAt: Date.now(),
        },
      ])

      try {
        const response = await sendChat(query, threadId, controller.signal)
        if (seq !== requestSeq.current) return

        const answer =
          response.answer?.trim() ||
          "I couldn't put together an answer for that. Please try asking another way."

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: answer,
                  products: response.used_context ?? [],
                  status: 'complete' as const,
                }
              : message,
          ),
        )

        if (Array.isArray(response.shopping_cart)) {
          setCart(response.shopping_cart)
        }
        setLastFailedQuery(null)
      } catch (error) {
        if (seq !== requestSeq.current) return

        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Something unexpected happened.'

        setMessages((previous) =>
          previous.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  status: 'error' as const,
                  error: message,
                }
              : item,
          ),
        )
        setLastFailedQuery(query)
      } finally {
        if (seq === requestSeq.current) {
          setIsLoading(false)
          abortRef.current = null
        }
      }
    },
    [threadId],
  )

  const sendMessage = useCallback(
    (text: string) => {
      const query = text.trim()
      if (!query || isLoading) return

      setMessages((previous) => [
        ...previous,
        {
          id: createId(),
          role: 'user',
          content: query,
          status: 'complete',
          createdAt: Date.now(),
        },
      ])

      void runRequest(query)
    },
    [isLoading, runRequest],
  )

  const retryLast = useCallback(() => {
    if (!lastFailedQuery || isLoading) return

    setMessages((previous) => {
      const next = [...previous]
      const last = next[next.length - 1]
      if (last?.role === 'assistant' && last.status === 'error') {
        next.pop()
      }
      return next
    })

    void runRequest(lastFailedQuery)
  }, [isLoading, lastFailedQuery, runRequest])

  const startNewChat = useCallback(() => {
    if (isLoading) return

    requestSeq.current += 1
    abortRef.current?.abort()
    abortRef.current = null

    setThreadId(createThreadId())
    setMessages([])
    setCart([])
    setLastFailedQuery(null)
    setIsLoading(false)
  }, [isLoading])

  return {
    threadId,
    messages,
    cart,
    isLoading,
    lastFailedQuery,
    sendMessage,
    retryLast,
    startNewChat,
  }
}
