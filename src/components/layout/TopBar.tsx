'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const TopBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gray-100 relative">
      <Link href="/offers" className="block">
        <div className="max-w-[1600px] mx-auto relative">
          
          {/* Desktop Banner */}
          <div className="hidden md:block">
            <Image
              src="https://res.cloudinary.com/dxooxiqcz/image/upload/v1763988428/987cdc3bf9940e6b1a6b7cdef88ceb34053b0e45_1763452592_cvydy3.gif"
              alt="بنر تخفیف"
              width={1600}
              height={80}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Mobile Banner - قد بیشتر */}
          <div className="md:hidden">
            <Image
              src="https://res.cloudinary.com/dxooxiqcz/image/upload/v1763989840/e12050ea14c679eac7085a161b02d8b22cc695e4_1763452593_zac8ie.gif"
              alt="بنر تخفیف موبایل"
              width={600}
              height={50}
              className="w-full h-8 object-cover"
              priority
            />
          </div>

          {/* Close Button - فقط دسکتاپ */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsVisible(false);
            }}
            className="hidden md:block absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition z-10"
            aria-label="بستن بنر"
          >
            <X size={18} />
          </button>

        </div>
      </Link>
    </div>
  );
};

export default TopBanner;