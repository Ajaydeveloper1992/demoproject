import { cn } from '~/lib/utils'

interface Props extends React.HTMLProps<HTMLDivElement> {}

const PaidStamp = ({ className }: Props) => {
  return (
    <div className={cn('relative inline-block', className)}>
      <div className="absolute inset-0 flex items-center justify-center rotate-[-35deg]">
        <div className="border-4 border-red-600 rounded-lg px-6 py-2">
          <span className="text-red-600 font-bold text-xl tracking-wider">
            PAID
          </span>
        </div>
      </div>
    </div>
  )
}

export default PaidStamp
