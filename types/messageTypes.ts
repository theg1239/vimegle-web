export interface Message {
  id: string;
  text: string;
  isSelf: boolean;
  timestamp: Date;
  reactions: { [key: string]: number };
  liked: boolean;
  replyTo?: Message | null;
  seen: boolean;
  isLastMessage?: boolean;
}
