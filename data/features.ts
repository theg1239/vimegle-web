import { Shield, Eye, Trash2, Lock } from 'lucide-react'
import { Feature } from '../types/feature'

export const features: Feature[] = [
  {
    icon: Shield,
    title: "Completely Anonymous",
    description: "Your identity is never revealed. Chat freely without any personal information shared.",
    gradientClass: "from-[#00DED1] to-[#7EF29D]",
    hoverMessage: "No need to register. Just start chatting anonymously with your peers."
  },
  {
    icon: Eye,
    title: "Secure Connections",
    description: "All chats are encrypted end-to-end, ensuring your conversations remain private.",
    gradientClass: "from-[#7928CA] to-[#FF0080]",
    hoverMessage: "Your conversations are secure and protected from unauthorized access."
  },
  {
    icon: Trash2,
    title: "No Data Stored",
    description: "Messages and calls are never recorded or stored. Your privacy is our priority.",
    gradientClass: "from-[#FF4D4D] to-[#F9CB28]",
    hoverMessage: "We do not retain any data from your conversations. Once closed, chats are gone."
  },
  {
    icon: Lock,
    title: "Advanced Encryption",
    description: "We use state-of-the-art encryption protocols to safeguard your communications.",
    gradientClass: "from-[#00DED1] to-[#7EF29D]",
    hoverMessage: "Our encryption ensures that your messages are only accessible to you and your chat partner."
  },
]

