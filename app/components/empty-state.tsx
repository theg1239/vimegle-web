import { Users } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

export function EmptyState() {
  return (
    <div className="text-center space-y-4">
      <img
        src="/discord-empty.png"
        alt="Empty voice channel"
        className="w-64 h-64 mx-auto"
      />
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">
          You're the only one here
        </h3>
        <p className="text-sm text-gray-400">
          Invite some friends to join you in the voice channel
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          className="bg-[#35373C] hover:bg-[#404249] text-white"
        >
          <Users className="w-4 h-4 mr-2" />
          Invite Friends
        </Button>
      </div>
    </div>
  )
}

