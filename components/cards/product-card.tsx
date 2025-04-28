import Image from 'next/image'
//
import { iProduct } from '~/types/product'
import { API_URL } from '~/lib/constants'
import { cn } from '~/lib/utils'
// Hooks
import { useCart } from '~/hooks/use-cart'
// Components
import { Card } from '~/components/ui/card'
import Icon from '~/components/icon'
import { useCustomer } from '~/hooks/use-customer'

interface Props {
  data: iProduct
}

const ProductCard = ({ data }: Props) => {
  const {
    addToCart,
    data: cart,
    onOpen,
    setModalType,
    setSelectCart,
  } = useCart()
  const customer = useCustomer(c => c.selectCustomer)

  const imgUrl = () => {
    if (data?.mediaFiles?.[0]) {
      return `${API_URL}/${data.mediaFiles[0].replace(/\\/g, '/')}`
    } else {
      return '/placeholder.svg'
    }
  }

  return (
    <Card
      className={cn('overflow-hidden relative cursor-pointer group')}
      onClick={() => {
        setSelectCart({
          id: data._id,
          _id: data._id,
          price: data.posprice,
          item: data,
          quantity: 1,
          customer,
          modifiers: {},
          itemNote: '',
          timestamp: new Date(),
        })
        if (data.modifiersgroup && data.modifiersgroup.length > 0) {
          setModalType('product')
          onOpen()
        } else {
          addToCart({
            item: {
              ...data,
              itemcustomname: data.name,
            },
            quantity: 1,
            modifiers: {},
            note: '',
            timestamp: new Date(),
          })
        }
      }}
    >
      <div className="relative h-52 select-none">
        <Image src={imgUrl()} alt={data.name} layout="fill" objectFit="cover" />
        <div className="z-10 relative text-sm flex flex-col justify-between h-full p-2 text-white">
          <p className="px-1 py-0.5 leading-none rounded-[2px] w-fit text-xs bg-black/80">
            Stock: <strong>{data?.stockQuantity}</strong>
          </p>
          <div className="[text-shadow:_0_1px_0_rgb(0_0_0_/_40%)] tracking-wide">
            <h3 className="font-semibold capitalize">
              {data.name.toLowerCase()}
            </h3>
            <p className="font-bold text-base">${data?.posprice?.toFixed(2)}</p>
          </div>
        </div>
        <div
          className={cn(
            'absolute inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 group-hover:scale-125 transition-all cursor-pointer',
            cart &&
              cart.length > 0 &&
              cart.find(item => item._id === data._id) &&
              'bg-green-700/40 group-hover:bg-green-700/50'
          )}
        >
          <Icon
            name="Plus"
            size={40}
            className="opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
          />
        </div>
      </div>
    </Card>
  )
}

export default ProductCard
