'use client'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import Image from 'next/image'
export default function ImageUpload({ label, imageType, onImageUpload }) {
  const [image, setImage] = useState(null)

  const handleImageUpload = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        setImage(e.target.result)
        onImageUpload(imageType, file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setImage(null)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${imageType}-upload`}>{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {image ? (
          <div className="space-y-2">
            <Image
              src={image}
              alt={`${label} preview`}
              className="max-w-full h-auto"
              width={100}
              height={100}
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById(`${imageType}-upload`).click()
                }
              >
                Change
              </Button>
              <Button variant="destructive" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <div className="mt-4 flex text-sm leading-6 text-gray-600">
              <label
                htmlFor={`${imageType}-upload`}
                className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id={`${imageType}-upload`}
                  name={`${imageType}-upload`}
                  type="file"
                  className="sr-only"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600">
              PNG, JPG, GIF up to 2.5MB
            </p>
          </div>
        )}
      </div>
      {imageType === 'logo' && (
        <p className="text-xs text-gray-500">
          The proposed size is 350px * 180px. No bigger than 2.5mb
        </p>
      )}
    </div>
  )
}
