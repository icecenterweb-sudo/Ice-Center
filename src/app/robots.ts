import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ice-center.ir'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/profile/',
                    '/checkout/',
                    '/auth/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
