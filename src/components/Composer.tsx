import { ArrowUp, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ComposerProps {
  isLoading: boolean
  onSend: (message: string) => void
}

export function Composer({ isLoading, onSend }: ComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 156)}px`
  }, [value])

  const submit = () => {
    const message = value.trim()
    if (!message || isLoading) return
    onSend(message)
    setValue('')
  }

  return (
    <div className="shrink-0 border-t border-line/60 bg-surface/85 px-3 pb-3 pt-2.5 backdrop-blur sm:px-5 sm:pb-4">
      <form
        className="mx-auto max-w-[860px]"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="flex items-end gap-2 rounded-[24px] border border-line bg-white p-1.5 shadow-[0_10px_35px_-24px_rgba(52,42,29,0.5)] transition focus-within:border-accent/35 focus-within:ring-4 focus-within:ring-accent/10">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={value}
            rows={1}
            maxLength={2000}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder="Ask about electronics, specs, or what to buy…"
            aria-label="Message ShopSmart"
            className="scrollbar-thin min-h-[42px] max-h-[156px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none placeholder:text-muted/55"
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            aria-label={isLoading ? 'Assistant is working' : 'Send message'}
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-[#fbf7ef] transition duration-200 hover:bg-[#16251d] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted/50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={17} strokeWidth={2.1} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-2">
          <p className="hidden text-[10px] text-muted/55 sm:block">
            Enter to send · Shift + Enter for a new line
          </p>
          <p className="text-[10px] text-muted/55">
            ShopSmart can make mistakes. Check product details before buying.
          </p>
        </div>
      </form>
    </div>
  )
}
