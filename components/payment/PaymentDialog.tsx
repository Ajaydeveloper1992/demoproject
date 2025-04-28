// Hooks
import { useCart } from '~/hooks/use-cart'
// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
//
import PayCashForm from './PayCashForm'
import PayCardForm from './PayCardForm'

export function PaymentDialog() {
  const { paymentMethod, setPaymentMethod } = useCart()

  return (
    <Tabs
      value={paymentMethod}
      className="flex-1"
      onValueChange={value => setPaymentMethod(value as 'Cash' | 'Card')}
    >
      <div className="flex">
        <TabsList className="flex justify-start flex-col h-auto p-2 rounded-none">
          <TabsTrigger
            value="Cash"
            className="w-32 h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Cash
          </TabsTrigger>
          <TabsTrigger
            value="Card"
            className="w-32 h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Credit Card
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="Cash" className="m-0">
            <PayCashForm />
          </TabsContent>
          <TabsContent value="Card" className="m-0">
            <PayCardForm />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
}
