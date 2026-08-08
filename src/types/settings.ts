export interface SiteSettings {
    siteTitle: string;
    siteSlogan: string;
    siteLogo: string;
    faviconUrl: string;
    phone: string;
    phoneFormatted: string;
    email: string;
    address: string;
    workingHours: string;
    aboutText: string;
    instagramUrl: string;
    telegramUrl: string;
    announcementText: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
    siteTitle: 'آیس سنتر',
    siteSlogan: 'با آیس سنتر، همیشه تخصصی بخر',
    siteLogo: '',
    faviconUrl: '',
    phone: '09122248917',
    phoneFormatted: '۰۹۱۲-۲۲۴-۸۹۱۷',
    email: 'icecenter.web@gmail.com',
    address: 'تهران، چهاردانگه، ماهر ۲۱',
    workingHours: 'شنبه تا چهارشنبه ۹ الی ۱۸ | پنجشنبه ۹ الی ۱۴',
    aboutText: 'آیس سنتر مرجع تخصصی تامین و راه‌اندازی انواع تجهیزات برودتی، بستنی‌سازهای قیفی شمس، دستگاه‌های اسپرسوساز صنعتی و کلیه ملزومات کافی‌شاپ و مطبخ‌های صنعتی در سراسر ایران است.',
    instagramUrl: 'https://instagram.com/icecenter',
    telegramUrl: 'https://t.me/icecenter',
    announcementText: '',
};
