'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { useAdmin } from '~/hooks/use-admin'
import axios from 'axios'
import Toastify from 'toastify-js'

export default function PaymentSettings() {
  const { data: session, status } = useSession()
  const setPaymentSettings = useAdmin(state => state.setPaymentSettings)
  const [userdata, setUserdata] = useState({})
  const [settings, setSettings] = useState({
    cashOnDelivery: true,
    nuvei: false,
    currency: 'CAD',
    decimalSeparator: '.',
    codInstructions: '',
    nuveiPublishableKey: '',
    nuveiSecretKey: '',
    merchantId: '',
    merchantSiteId: '',
    mode: 'test',
  })

  const userId = userdata.user ? userdata.user.id : ''

  // Use useCallback to memoize fetchUserMetaByIdAndKey
  const fetchUserMetaByIdAndKey = useCallback(
    async (userId, metaKey) => {
      if (userId) {
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/${userId}?meta_key=${metaKey}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          console.log('API Response:', response) // Log full response
          if (response.status === 200) {
            const userMeta = response.data.data
            if (userMeta) {
              const { meta_value } = userMeta
              const parsedValue = JSON.parse(meta_value)
              setSettings(parsedValue)
              setPaymentSettings(parsedValue) // Call to set payment settings
            }
          }
        } catch (error) {
          console.error('Error fetching user meta:', error)
        }
      }
    },
    [userdata, setPaymentSettings]
  ) // Include setPaymentSettings in the dependency array

  // Update useEffect to include fetchUserMetaByIdAndKey and userId
  useEffect(() => {
    if (status === 'authenticated') {
      setUserdata(session)
      fetchUserMetaByIdAndKey(userId, 'paymentSettings')
    }
  }, [session, status, fetchUserMetaByIdAndKey, userId]) // Added fetchUserMetaByIdAndKey and userId as dependencies

  const handleSubmit = async event => {
    event.preventDefault()
    const payload = {
      userId,
      meta_key: 'paymentSettings',
      meta_value: JSON.stringify(settings),
    }

    let token =
      userdata.user && userdata.user.name ? userdata.user.name.token : ''

    try {
      const existingResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/${userId}?meta_key=paymentSettings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (existingResponse.status === 200) {
        const userMeta = existingResponse.data.data
        if (userMeta) {
          const existingMetaId = userMeta._id

          const updateResponse = await axios.put(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/editusermeta/${existingMetaId}`,
            {
              meta_value: JSON.stringify(settings),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (updateResponse.status === 200) {
            Toastify({
              text: 'User meta updated successfully.',
              duration: 3000,
            }).showToast()
          }
        }
      } else {
        const createResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/createusermeta`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (createResponse.status === 201) {
          Toastify({
            text: createResponse.data.message,
            duration: 3000,
          }).showToast()
        }
      }
    } catch (error) {
      const createResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/createusermeta`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (createResponse.status === 201) {
        Toastify({
          text: createResponse.data.message,
          duration: 3000,
        }).showToast()
      } else {
        console.error('Error handling user meta submission:', error)
        Toastify({
          text: 'Error saving settings.',
          duration: 3000,
          backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)',
        }).showToast()
      }
    }
  }

  return (
    <Card className="w-full">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Payment Settings</h1>
        <form onSubmit={handleSubmit}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="general-settings">
              <AccordionTrigger className="text-lg font-semibold">
                General Settings
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="border rounded p-2"
                    value={settings.currency}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                  >
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="decimal-separator">Decimal Separator</Label>
                  <select
                    id="decimal-separator"
                    className="border rounded p-2"
                    value={settings.decimalSeparator}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        decimalSeparator: e.target.value,
                      }))
                    }
                  >
                    <option value=".">Dot (.)</option>
                    <option value=",">Comma (,)</option>
                  </select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cash-on-delivery">
              <AccordionTrigger className="text-lg font-semibold">
                Cash on Delivery
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cod-toggle">Enable Cash on Delivery</Label>
                  <Switch
                    id="cod-toggle"
                    checked={settings.cashOnDelivery}
                    onCheckedChange={checked =>
                      setSettings(prev => ({
                        ...prev,
                        cashOnDelivery: checked,
                      }))
                    }
                  />
                </div>
                {settings.cashOnDelivery && (
                  <div className="space-y-2">
                    <Label htmlFor="cod-instructions">
                      Instructions for Cash on Delivery
                    </Label>
                    <Input
                      id="cod-instructions"
                      placeholder="Pay with cash upon delivery."
                      value={settings.codInstructions}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          codInstructions: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="nuvei">
              <AccordionTrigger className="text-lg font-semibold">
                Nuvei
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nuvei-toggle">Enable Nuvei</Label>
                  <Switch
                    id="nuvei-toggle"
                    checked={settings.nuvei}
                    onCheckedChange={checked =>
                      setSettings(prev => ({ ...prev, nuvei: checked }))
                    }
                  />
                </div>
                {settings.nuvei && (
                  <div className="space-y-2">
                    <Label htmlFor="nuvei-secret-key">Secret Key</Label>
                    <Input
                      id="nuvei-secret-key"
                      type="text"
                      placeholder="Enter Nuvei secret key"
                      value={settings.nuveiSecretKey}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          nuveiSecretKey: e.target.value,
                        }))
                      }
                    />
                    <Label htmlFor="merchant-id">Merchant ID</Label>
                    <Input
                      id="merchant-id"
                      placeholder="Enter Merchant ID"
                      value={settings.merchantId}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          merchantId: e.target.value,
                        }))
                      }
                    />
                    <Label htmlFor="merchant-site-id">Merchant Site ID</Label>
                    <Input
                      id="merchant-site-id"
                      placeholder="Enter Merchant Site ID"
                      value={settings.merchantSiteId}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          merchantSiteId: e.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center">
                      <Label htmlFor="mode-toggle">Live Mode</Label>
                      <Switch
                        id="mode-toggle"
                        checked={settings.mode === 'live'}
                        onCheckedChange={checked =>
                          setSettings(prev => ({
                            ...prev,
                            mode: checked ? 'live' : 'test',
                          }))
                        }
                      />
                      <span className="ml-2">
                        {settings.mode === 'live' ? 'Live' : 'Test'}
                      </span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-6">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
