import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send } from "lucide-react"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  isClient: boolean
}

interface ChatPopupProps {
  clientName: string
  onClose: () => void
}

const ChatPopup: React.FC<ChatPopupProps> = ({ clientName, onClose }) => {
  const [newMessage, setNewMessage] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Demo messages
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      sender: clientName,
      content: "Hi coach, I have a question about my nutrition plan",
      timestamp: "10:30 AM",
      isClient: true
    },
    {
      id: 2,
      sender: "Coach",
      content: "Of course! What would you like to know?",
      timestamp: "10:32 AM",
      isClient: false
    },
    {
      id: 3,
      sender: clientName,
      content: "I'm not sure if I'm getting enough protein. Can you review my food log?",
      timestamp: "10:33 AM",
      isClient: true
    },
    {
      id: 4,
      sender: "Coach",
      content: "I'll take a look at your food log and get back to you with recommendations.",
      timestamp: "10:35 AM",
      isClient: false
    }
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        sender: "Coach",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isClient: false
      }
      setMessages([...messages, newMsg])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <Card className="w-[400px] h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Chat with {clientName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isClient ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isClient
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.isClient ? 'text-gray-500' : 'text-blue-100'}`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatPopup 