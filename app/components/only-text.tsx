// // app/components/TextChat.tsx

// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Button } from "@/app/components/ui/button";
// import { Input } from "@/app/components/ui/input";
// import { ScrollArea } from "@/app/components/ui/scroll-area";
// import { Tooltip, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";
// import { motion, AnimatePresence } from 'framer-motion';
// import { Send, Smile, ThumbsUp, Heart, Laugh, Frown, Angry } from 'lucide-react';

// interface Message {
//   id: string;
//   text: string;
//   isSelf: boolean;
//   reactions: { [key: string]: number };
// }

// interface TextChatProps {
//   initialMessages: Message[];
//   onSendMessage: (message: string) => void;
//   connected: boolean;
// }

// const emojis = [
//   { icon: <ThumbsUp className="w-4 h-4" />, name: '👍' },
//   { icon: <Heart className="w-4 h-4" />, name: '❤️' },
//   { icon: <Laugh className="w-4 h-4" />, name: '😂' },
//   { icon: <Frown className="w-4 h-4" />, name: '😢' },
//   { icon: <Angry className="w-4 h-4" />, name: '😠' },
// ];

// export default function TextChat({ initialMessages, onSendMessage, connected }: TextChatProps) {
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [message, setMessage] = useState('');
//   const [showEmojis, setShowEmojis] = useState<string | null>(null);
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const lastMessageRef = useRef<HTMLDivElement>(null);

//   const handleSend = () => {
//     if (message.trim()) {
//       const newMessage: Message = {
//         id: Date.now().toString(),
//         text: message.trim(),
//         isSelf: true,
//         reactions: {}
//       };
//       setMessages([...messages, newMessage]);
//       onSendMessage(message.trim());
//       setMessage('');
//     }
//   };

//   const handleReaction = (messageId: string, emoji: string) => {
//     setMessages(messages.map(msg => 
//       msg.id === messageId 
//         ? { ...msg, reactions: { ...msg.reactions, [emoji]: (msg.reactions[emoji] || 0) + 1 } }
//         : msg
//     ));
//     setShowEmojis(null);
//   };

//   useEffect(() => {
//     lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-white">
//       <header className="bg-black/30 backdrop-blur-sm p-4 shadow-lg">
//         <h1 className="text-2xl font-bold text-center">Vomegle Chat</h1>
//       </header>

//       <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
//         <AnimatePresence initial={false}>
//           {messages.map((msg, index) => (
//             <motion.div
//               key={msg.id}
//               initial={{ y: 20, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: -20, opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               className={`mb-4 ${msg.isSelf ? 'text-right' : 'text-left'}`}
//               ref={index === messages.length - 1 ? lastMessageRef : null}
//             >
//               <div className={`inline-block max-w-[70%] ${msg.isSelf ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg p-3 shadow-md relative group`}>
//                 <p>{msg.text}</p>
//                 <div className="absolute bottom-0 left-0 transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="text-white"
//                     onClick={() => setShowEmojis(showEmojis === msg.id ? null : msg.id)}
//                   >
//                     <Smile className="w-4 h-4" />
//                   </Button>
//                 </div>
//                 {showEmojis === msg.id && (
//                   <div className="absolute bottom-0 left-0 transform -translate-y-full bg-gray-800 rounded-lg shadow-lg p-2 flex space-x-2">
//                     {emojis.map((emoji) => (
//                       <Tooltip key={emoji.name}>
//                         <TooltipTrigger asChild>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-white hover:bg-gray-700"
//                             onClick={() => handleReaction(msg.id, emoji.name)}
//                           >
//                             {emoji.icon}
//                           </Button>
//                         </TooltipTrigger>
//                         <TooltipContent>{emoji.name}</TooltipContent>
//                       </Tooltip>
//                     ))}
//                   </div>
//                 )}
//               </div>
//               {Object.entries(msg.reactions).length > 0 && (
//                 <div className={`mt-1 space-x-1 text-sm ${msg.isSelf ? 'text-right' : 'text-left'}`}>
//                   {Object.entries(msg.reactions).map(([emoji, count]) => (
//                     <span key={emoji} className="inline-block bg-gray-800 rounded-full px-2 py-1">
//                       {emoji} {count}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </ScrollArea>

//       <div className="p-4 bg-black/50 backdrop-blur-sm">
//         <div className="flex items-center space-x-2">
//           <Input
//             type="text"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && handleSend()}
//             placeholder="Type a message..."
//             disabled={!connected}
//             className="flex-grow bg-white/10 border-white/20 text-white placeholder-white/50"
//           />
//           <Button
//             onClick={handleSend}
//             disabled={!connected}
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             <Send className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
