import { cn } from '~/lib/utils'
import Image from 'next/image'
const Loading = ({ className }) => {
  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50',
        className
      )}
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* <svg
            className="w-8 h-8 text-primary animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg> */}
          <Image
            src="/images/zipzappos-icon.png"
            alt="ZipZappos Logo"
            width={50} // Adjust width
            height={50} // Adjust height
          />
        </div>
      </div>
    </div>
  )
}
export default Loading
