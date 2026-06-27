import { Shield, Wrench, Headset, Clock, Truck } from 'lucide-react';

export default function TrustBadges() {
    const features = [
        {
            icon: Shield,
            title: 'ضمانت اصالت کالا',
            desc: '۱۰۰٪ کالاها اصلی هستند'
        },
        {
            icon: Truck,
            title: 'ارسال سریع',
            desc: 'ارسال به سراسر کشور'
        },
        {
            icon: Headset,
            title: 'پشتیبانی ۲۴/۷',
            desc: 'پاسخگویی در تمام ساعات'
        },
        {
            icon: Wrench,
            title: 'نصب رایگان',
            desc: 'در محل مشتری'
        },
        {
            icon: Clock,
            title: '۷ روز ضمانت بازگشت',
            desc: 'در صورت عدم رضایت'
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-t border-b border-gray-100 mb-8 items-stretch">
            {features.slice(0, 4).map((item, index) => (
                <div key={index} className="flex flex-row lg:flex-col items-center justify-center lg:justify-start text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors gap-3 lg:gap-0">
                    <div className="w-12 h-12 lg:mb-3 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                        <item.icon className="w-6 h-6 stroke-1.5" />
                    </div>
                    <div className="text-right lg:text-center">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
