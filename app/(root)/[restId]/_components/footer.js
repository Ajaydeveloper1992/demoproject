'use client'
import React from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { FacebookIcon, InstagramIcon, TwitterIcon } from 'lucide-react'
import Image from 'next/image'
export default function Footer() {
  return (
    <>
      <footer className="bg-[#f5f5f5] text-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                <Image
                  src="/images/zipzappos-logo.svg"
                  alt="ZipZappos Logo"
                  width={150} // Adjust width
                  height={50} // Adjust height
                />
              </h3>
              <p className="text-gray-600 mb-4">
                Crafting delicious pizzas and memorable dining experiences since
                1985.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <FacebookIcon className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <InstagramIcon className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">Instagram</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <TwitterIcon className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Menu
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Locations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Rewards
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Gift Cards
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    FAQs
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
              <p className="text-gray-600 mb-4">
                Subscribe to our newsletter for the latest updates and offers.
              </p>
              <form className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-white text-gray-800 border-gray-300"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-600">
            <p>
              &copy; {new Date().getFullYear()} ZipZap. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
