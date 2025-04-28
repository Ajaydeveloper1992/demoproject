'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
//import { useUser } from '~/hooks/UserContext';
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import axios from 'axios'
import Toastify from 'toastify-js'
export default function ProfileManagement() {
  //const { user } = useUser();
  const { data: session } = useSession()
  const [userdata, setUserdata] = useState({})
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    usernames: '',
    email: '',
    phonenumber: '',
    password: '',
    pin: '',
    bio: '',
    urls: [],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  useEffect(() => {
    setUserdata(session)
  }, [session])

  // let userId = userdata && userdata.user ? userdata.user.id : ''; // Ensure you have the correct user ID
  // let token = userdata && userdata.user && userdata.user.name ? userdata.user.name.token : '';
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (userdata) {
        let userId = userdata.user ? userdata.user.id : ''
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/getuserdetails/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const userDetails = response.data.data
          //console.log("user detail: " + JSON.stringify(userDetails));

          if (userDetails) {
            const bioMeta = userDetails.userMeta.find(
              meta => meta.meta_key === 'bio'
            )
            const urlMeta = userDetails.userMeta
              .filter(meta => meta.meta_key === 'url')
              .map(meta => meta.meta_value)

            setProfile({
              firstName: userDetails.user.fname || '',
              lastName: userDetails.user.lname || '',
              usernames: userDetails.user.username || '',
              email: userDetails.user.email || '',
              phonenumber: userDetails.user.phone || '',
              password: '',
              pin: userDetails.user.pin || '',
              bio: bioMeta ? bioMeta.meta_value : '', // Set bio if exists
              urls: urlMeta, // Set URLs directly
            })
          }
        } catch (error) {
          console.error('Error fetching user details:', error)
          // Toastify({
          //   text: "Error fetching user details",
          //   duration: 3000,
          //   close: true,
          //   gravity: "top",
          //   position: 'right',
          //   backgroundColor: "linear-gradient(to right, #FF5C5C, #FF3B3B)",
          // }).showToast();
        }
      }
    }

    fetchUserDetails()
  }, [userdata])

  const handleInputChange = e => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleUrlChange = (index, value) => {
    const newUrls = [...profile.urls]
    newUrls[index] = value
    setProfile(prev => ({ ...prev, urls: newUrls }))
  }

  const addUrl = () => {
    setProfile(prev => ({ ...prev, urls: [...prev.urls, ''] }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const profileData = {
      username: profile.usernames,
      email: profile.email,
      fname: profile.firstName,
      lname: profile.lastName,
      phone: profile.phonenumber,
      password: profile.password || undefined, // Include only if updated
      pin: profile.pin || '',
      bio: profile.bio,
      urls: profile.urls.filter(url => url), // Filter out empty URLs
    }

    try {
      let userId = userdata && userdata.user ? userdata.user.id : ''
      let token =
        userdata && userdata.user && userdata.user.name
          ? userdata.user.name.token
          : ''

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile/${userId}`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Send the token if needed
          },
        }
      )

      Toastify({
        text: 'Profile updated successfully',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()
    } catch (error) {
      console.error('Error updating profile:', error)
      if (error.response) {
        Toastify({
          text: 'Error: ' + error.response.data.message,
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      } else {
        Toastify({
          text: 'Error: An unexpected error occurred.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
  }
  // Password Generat
  const generatePassword = () => {
    const length = 12
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setProfile(prevData => ({ ...prevData, password }))
  }
  // Pin Generate
  const generatePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString() // Generates a 6-digit number
    setProfile(prevData => ({ ...prevData, pin }))
  }
  console.log(profile)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          This is how others will see you on the site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              value={profile.lastName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <p>User: {profile.usernames}</p>
            <Input
              id="usernames"
              name="usernames"
              value={profile.usernames}
              onChange={handleInputChange}
            />
            <p className="text-sm text-gray-500">
              This is your public display name. It can be your real name or a
              pseudonym. You can only change this once every 30 days.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
            />
            <p className="text-sm text-gray-500">
              You can manage verified email addresses in your email settings.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="phonenumber" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phonenumber"
              name="phonenumber"
              type="text"
              value={profile.phonenumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="flex">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={profile.password}
                onChange={handleInputChange}
                required
                className="flex-grow"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Enter a new password to update it.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN
            </label>
            <div className="flex">
              <Input
                id="pin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                value={profile.pin}
                onChange={handleInputChange}
                required
                className="flex-grow"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPin(!showPin)}
                className="ml-2"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePin}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              You can @mention other users and organizations to link to them.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URLs</label>
            <p className="text-sm text-gray-500">
              Add links to your website, blog, or social media profiles.
            </p>
            {profile.urls.map((url, index) => (
              <Input
                key={index}
                value={url}
                onChange={e => handleUrlChange(index, e.target.value)}
                className="mb-2"
              />
            ))}
            <Button type="button" onClick={addUrl} variant="outline">
              Add URL
            </Button>
          </div>
          <Button type="submit">Update profile</Button>
        </form>
      </CardContent>
    </Card>
  )
}
