import { Metadata } from 'next';
import SettingsClient from './SettingsClient';
import { requireRolePage } from '@/lib/admin-auth';

export const metadata: Metadata = {
    title: 'تنظیمات عمومی سایت | پنل مدیریت آیس سنتر',
    description: 'مدیریت نام سایت، شعار، لوگو، فاوآیکون، شماره تلفن، ایمیل، آدرس و شبکه های اجتماعی',
};

export default async function SettingsPage() {
    await requireRolePage('SETTINGS');
    return <SettingsClient />;
}
