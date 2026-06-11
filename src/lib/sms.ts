import https from 'https'
import type { IncomingMessage } from 'http'

function getMelipayamakApiKey(): string {
    const key = process.env.MELIPAYAMAK_API_KEY;
    if (!key) {
        throw new Error('MELIPAYAMAK_API_KEY environment variable is required.');
    }
    return key;
}

interface SendOtpResponse {
    success: boolean
    code?: string
    error?: string
}

interface MelipayamakResponse {
    code: string
    status: string
}

/**
 * Send OTP via Melipayamak service
 * The service generates and sends the OTP code, returning it in the response
 */
export async function sendOtp(phone: string): Promise<SendOtpResponse> {
    return new Promise((resolve) => {
        const data = JSON.stringify({ to: phone })

        const options = {
            hostname: 'console.melipayamak.com',
            port: 443,
            path: `/api/send/otp/${getMelipayamakApiKey()}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        }

        const req = https.request(options, (res: IncomingMessage) => {
            let responseData = ''

            res.on('data', (chunk: Buffer) => {
                responseData += chunk.toString()
            })

            res.on('end', () => {
                try {
                    const parsed: MelipayamakResponse = JSON.parse(responseData)

                    // Melipayamak returns the OTP code in the 'code' field
                    // Status contains Persian text like "ارسال موفق بود"
                    if (parsed.code && parsed.status.includes('موفق')) {
                        resolve({
                            success: true,
                            code: parsed.code,
                        })
                    } else {
                        resolve({
                            success: false,
                            error: parsed.status || 'Failed to send OTP',
                        })
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        error: 'Failed to parse SMS service response',
                    })
                }
            })
        })

        req.on('error', (error: Error) => {
            console.error('SMS service error:', error)
            resolve({
                success: false,
                error: 'SMS service connection failed',
            })
        })

        req.write(data)
        req.end()
    })
}

/**
 * Validate Iranian mobile phone format
 * Accepts formats: 09XXXXXXXXX or 9XXXXXXXXX
 */
export function isValidIranianMobile(phone: string): boolean {
    // Remove any spaces or dashes
    const cleaned = phone.replace(/[\s-]/g, '')

    // Match Iranian mobile numbers
    // 09XX XXX XXXX (11 digits starting with 09)
    // or 9XX XXX XXXX (10 digits starting with 9)
    const pattern = /^(0?9\d{9})$/
    return pattern.test(cleaned)
}

/**
 * Normalize phone number to standard format (09XXXXXXXXX)
 */
export function normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s-]/g, '')
    if (cleaned.startsWith('9') && cleaned.length === 10) {
        return '0' + cleaned
    }
    return cleaned
}
