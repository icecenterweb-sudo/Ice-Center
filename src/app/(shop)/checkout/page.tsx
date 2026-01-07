'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    ShoppingBag,
    User,
    MapPin,
    CreditCard,
    Shield,
    Truck,
    Check,
    ChevronRight,
    Package,
    CheckCircle2,
    Home,
    ClipboardList
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { toPersianDigits } from '@/lib/numbers';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Checkout form validation schema
const checkoutSchema = z.object({
    firstName: z.string().min(1, 'نام الزامی است').max(50),
    lastName: z.string().min(1, 'نام خانوادگی الزامی است').max(50),
    phone: z.string().min(10, 'شماره موبایل معتبر نیست').max(11),
    province: z.string().min(1, 'استان الزامی است'),
    city: z.string().min(1, 'شهر الزامی است'),
    address: z.string().min(5, 'آدرس کامل الزامی است'),
    postalCode: z.string().optional(),
    deliveryNotes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Define steps
const STEPS = [
    { id: 1, title: 'اطلاعات تماس', subtitle: 'نام و شماره موبایل', icon: User },
    { id: 2, title: 'آدرس ارسال', subtitle: 'مشخصات دریافت کننده', icon: MapPin },
    { id: 3, title: 'پرداخت و تکمیل', subtitle: 'تکمیل فرآیند خرید', icon: CreditCard },
    { id: 4, title: 'ثبت سفارش', subtitle: 'سفارش شما ثبت شد', icon: CheckCircle2 },
];

// Iranian provinces
const provinces = [
    'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'خوزستان',
    'مازندران', 'گیلان', 'کرمان', 'آذربایجان غربی', 'همدان', 'قزوین',
    'قم', 'مرکزی', 'یزد', 'کرمانشاه', 'سمنان', 'لرستان', 'کردستان',
    'بوشهر', 'زنجان', 'اردبیل', 'چهارمحال و بختیاری', 'سیستان و بلوچستان',
    'ایلام', 'کهگیلویه و بویراحمد', 'گلستان', 'هرمزگان', 'خراسان شمالی',
    'خراسان جنوبی', 'البرز'
];

// Modern Stepper Component - Premium Design
function StepperArrow({ steps, currentStep }: { steps: typeof STEPS; currentStep: number }) {
    return (
        <>
            {/* Desktop Stepper */}
            <div className="hidden md:flex w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-sm">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.id} className="relative flex-1">
                            {/* Step Box */}
                            <div className={`
                                relative flex items-center gap-4 px-6 py-5 h-full
                                transition-all duration-300
                                ${isActive
                                    ? 'bg-blue-50'
                                    : isCompleted
                                        ? 'bg-green-50'
                                        : 'bg-gray-50'
                                }
                            `}>
                                {/* Icon */}
                                <div className={`
                                    w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                                    transition-all duration-300
                                    ${isActive
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                        : isCompleted
                                            ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                                            : 'bg-gray-200 text-gray-400'
                                    }
                                `}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm font-bold leading-tight transition-colors ${isActive ? 'text-gray-900' : isCompleted ? 'text-green-800' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-xs mt-0.5 transition-colors ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        {step.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Triangle Arrow Connector */}
                            {!isLast && (
                                <>
                                    {/* Outer triangle */}
                                    <div
                                        className={`
                                            absolute top-1/2 left-0 z-10
                                            w-0 h-0 
                                            border-t-[34px] border-t-transparent
                                            border-b-[34px] border-b-transparent
                                            border-l-[18px]
                                            transition-colors duration-300
                                            ${isActive ? 'border-l-blue-500' : isCompleted ? 'border-l-transparent' : 'border-l-gray-50'}
                                        `}
                                        style={{ transform: 'translateY(-50%) translateX(-100%)' }}
                                    />
                                    {/* Inner triangle (creates the arrow pointing left) */}
                                    <div
                                        className={`
                                            absolute top-1/2 left-0 z-20
                                            w-0 h-0 
                                            border-t-[34px] border-t-transparent
                                            border-b-[34px] border-b-transparent
                                            border-l-[18px]
                                            transition-colors duration-300
                                            ${(() => {
                                                const nextStep = steps[index + 1];
                                                const nextIsActive = currentStep === nextStep?.id;
                                                const nextIsCompleted = currentStep > nextStep?.id;
                                                return nextIsActive ? 'border-l-blue-50' : nextIsCompleted ? 'border-l-green-50' : 'border-l-gray-50';
                                            })()}
                                        `}
                                        style={{ transform: 'translateY(-50%) translateX(0)' }}
                                    />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile Stepper */}
            <div className="md:hidden w-full space-y-3">
                {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                        <div key={step.id} className={`
                            flex items-center gap-4 p-4 rounded-2xl transition-all duration-300
                            ${isActive ? 'bg-blue-50 shadow-sm' : isCompleted ? 'bg-green-50' : 'bg-gray-50 opacity-60'}
                        `}>
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
                            `}>
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold ${isActive ? 'text-gray-900' : isCompleted ? 'text-green-800' : 'text-gray-400'}`}>{step.title}</h3>
                                <p className={`text-xs ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{step.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, itemCount, totalPrice, isLoading: cartLoading } = useCart();
    const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

    // Current step
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Form handling with react-hook-form + zod
    const {
        register,
        watch,
        trigger,
        reset,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            province: '',
            city: '',
            address: '',
            postalCode: '',
            deliveryNotes: '',
        },
    });

    // Watch form values for review step
    const formValues = watch();

    // Pre-fill user data
    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                province: '',
                city: '',
                address: '',
                postalCode: '',
                deliveryNotes: '',
            });
        }
    }, [user, reset]);

    // Redirect if cart is empty (after loading finishes, but not on success step)
    useEffect(() => {
        if (!cartLoading && items.length === 0 && !orderId) {
            toast.error('سبد خرید شما خالی است');
            router.push('/');
        }
    }, [cartLoading, items.length, router, orderId]);

    const formatPrice = (price: number) => {
        return toPersianDigits(price.toLocaleString('fa-IR'));
    };

    // Calculate totals
    const shippingCost = 0;
    const finalTotal = totalPrice + shippingCost;

    const handleNextStep = async () => {
        // Validate current step before moving forward
        if (currentStep === 1) {
            if (!isAuthenticated) {
                toast.error('لطفاً ابتدا وارد شوید');
                openAuthModal();
                return;
            }
            const isValid = await trigger(['firstName', 'lastName', 'phone']);
            if (!isValid) {
                toast.error('لطفاً همه فیلدها را پر کنید');
                return;
            }
        } else if (currentStep === 2) {
            const isValid = await trigger(['province', 'city', 'address']);
            if (!isValid) {
                toast.error('لطفاً همه فیلدهای اجباری را پر کنید');
                return;
            }
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const submitOrder = async () => {
        if (!isAuthenticated) {
            toast.error('لطفاً ابتدا وارد شوید');
            openAuthModal();
            return;
        }

        setIsSubmitting(true);

        // TODO: Implement order submission API
        setTimeout(() => {
            // Generate a random order ID
            const newOrderId = `ICE-${Date.now().toString(36).toUpperCase()}`;
            setOrderId(newOrderId);
            setIsSubmitting(false);
            setCurrentStep(4); // Move to success step
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.success('سفارش شما با موفقیت ثبت شد!');
        }, 2000);
    };

    // Loading skeleton
    if (cartLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    // Don't render if cart is empty (unless we're on success step with order ID)
    if (items.length === 0 && !orderId) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Stepper Section */}
            <div className="border-b border-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    {/* Arrow Stepper */}
                    <StepperArrow steps={STEPS} currentStep={currentStep} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Form - Left Side */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Contact Information */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        {!isAuthenticated && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-semibold text-blue-900 mb-1">برای ثبت سفارش، وارد شوید</h3>
                                                        <p className="text-xs text-blue-700 mb-3">سفارش شما ذخیره می‌شود و پیگیری آسان‌تر است</p>
                                                        <button
                                                            onClick={() => openAuthModal()}
                                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            ورود یا ثبت‌نام
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900">اطلاعات تماس</h2>
                                                <p className="text-xs text-gray-500">نام و شماره موبایل خود را وارد کنید</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
                                                    <input
                                                        type="text"
                                                        {...register('firstName')}
                                                        placeholder="نام"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    />
                                                    {errors.firstName && (
                                                        <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">نام خانوادگی *</label>
                                                    <input
                                                        type="text"
                                                        {...register('lastName')}
                                                        placeholder="نام خانوادگی"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    />
                                                    {errors.lastName && (
                                                        <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">شماره موبایل *</label>
                                                <input
                                                    type="tel"
                                                    {...register('phone')}
                                                    placeholder="09xxxxxxxxx"
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dir-ltr text-left"
                                                    disabled={isAuthenticated}
                                                />
                                                {errors.phone && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                                                )}
                                                {isAuthenticated && (
                                                    <p className="text-xs text-gray-500 mt-1.5">شماره موبایل از حساب کاربری شما</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={handleNextStep}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <span>مرحله بعد</span>
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Shipping Address */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900">آدرس ارسال</h2>
                                                <p className="text-xs text-gray-500">آدرس کامل خود را وارد کنید</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">استان *</label>
                                                    <select
                                                        {...register('province')}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    >
                                                        <option value="">انتخاب استان</option>
                                                        {provinces.map((p) => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    {errors.province && (
                                                        <p className="text-xs text-red-500 mt-1">{errors.province.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">شهر *</label>
                                                    <input
                                                        type="text"
                                                        {...register('city')}
                                                        placeholder="نام شهر"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    />
                                                    {errors.city && (
                                                        <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">آدرس کامل *</label>
                                                <textarea
                                                    {...register('address')}
                                                    placeholder="خیابان، کوچه، پلاک، واحد"
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                                />
                                                {errors.address && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">کد پستی (اختیاری)</label>
                                                <input
                                                    type="text"
                                                    {...register('postalCode')}
                                                    placeholder="کد پستی ۱۰ رقمی"
                                                    maxLength={10}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dir-ltr text-left"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات ارسال (اختیاری)</label>
                                                <textarea
                                                    {...register('deliveryNotes')}
                                                    placeholder="توضیحات تکمیلی برای پیک"
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-between">
                                            <button
                                                onClick={handlePreviousStep}
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                                <span>مرحله قبل</span>
                                            </button>
                                            <button
                                                onClick={handleNextStep}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <span>مرحله بعد</span>
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Payment & Review */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="space-y-6">
                                        {/* Payment Method */}
                                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-bold text-gray-900">روش پرداخت</h2>
                                                    <p className="text-xs text-gray-500">انتخاب روش پرداخت</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Online Payment - Coming Soon */}
                                                <div className="relative overflow-hidden">
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl opacity-60 cursor-not-allowed">
                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-600">پرداخت آنلاین</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">کارت به کارت و درگاه بانکی</p>
                                                        </div>
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">به‌زودی</span>
                                                    </div>
                                                </div>

                                                {/* Cash on Delivery - Active */}
                                                <div className="flex items-start gap-4 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                                                    <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-white mt-0.5 flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">پرداخت در محل</p>
                                                        <p className="text-xs text-gray-600 mt-0.5">پرداخت هنگام تحویل سفارش</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Review Info */}
                                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                            <h3 className="text-base font-bold text-gray-900 mb-4">بررسی نهایی</h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">نام</span>
                                                    <span className="font-medium text-gray-900">{formValues.firstName} {formValues.lastName}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">موبایل</span>
                                                    <span className="font-medium text-gray-900 dir-ltr">{formValues.phone}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">استان</span>
                                                    <span className="font-medium text-gray-900">{formValues.province}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">شهر</span>
                                                    <span className="font-medium text-gray-900">{formValues.city}</span>
                                                </div>
                                                <div className="py-2">
                                                    <span className="text-gray-600">آدرس</span>
                                                    <p className="font-medium text-gray-900 mt-1">{formValues.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                onClick={handlePreviousStep}
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                                <span>مرحله قبل</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Order Success */}
                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                                        {/* Success Animation */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                        >
                                            <CheckCircle2 className="w-14 h-14 text-green-500" />
                                        </motion.div>

                                        <motion.h2
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-2xl font-bold text-gray-900 mb-2"
                                        >
                                            سفارش شما ثبت شد!
                                        </motion.h2>

                                        <motion.p
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-gray-500 mb-6"
                                        >
                                            از خرید شما متشکریم. سفارش شما در حال پردازش است.
                                        </motion.p>

                                        {/* Order ID Box */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 max-w-sm mx-auto"
                                        >
                                            <p className="text-sm text-blue-600 mb-1">شماره سفارش</p>
                                            <p className="text-xl font-bold text-blue-900 font-mono tracking-wider">{orderId}</p>
                                        </motion.div>

                                        {/* Action Buttons */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="flex flex-col sm:flex-row gap-4 justify-center"
                                        >
                                            <Link
                                                href="/"
                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                <Home className="w-5 h-5" />
                                                <span>بازگشت به صفحه اصلی</span>
                                            </Link>
                                            <Link
                                                href="/orders"
                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                <ClipboardList className="w-5 h-5" />
                                                <span>مشاهده وضعیت سفارش</span>
                                            </Link>
                                        </motion.div>

                                        {/* Info Text */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                            className="text-xs text-gray-400 mt-8"
                                        >
                                            اطلاعات سفارش از طریق پیامک برای شما ارسال خواهد شد.
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary - Right Sidebar */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-6">
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-gray-400" />
                                        خلاصه سفارش
                                    </h2>
                                </div>

                                <div className="p-6 max-h-96 overflow-y-auto">
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex gap-3">
                                                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                    {item.product.thumbnail ? (
                                                        <Image
                                                            src={item.product.thumbnail}
                                                            alt={item.product.name}
                                                            fill
                                                            className="object-contain p-1"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
                                                        {toPersianDigits(item.quantity)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1.5">
                                                        {formatPrice(item.product.price)} × {toPersianDigits(item.quantity)}
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">
                                                        {formatPrice(item.product.price * item.quantity)} تومان
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">جمع کالاها ({toPersianDigits(itemCount)} کالا)</span>
                                        <span className="font-medium text-gray-900">{formatPrice(totalPrice)} تومان</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">هزینه ارسال</span>
                                        <span className="font-medium text-green-600">رایگان</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600">مبلغ قابل پرداخت</span>
                                            <div className="text-left">
                                                <p className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal)}</p>
                                                <p className="text-xs text-gray-500">تومان</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {currentStep === 3 && (
                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={submitOrder}
                                            disabled={isSubmitting || !isAuthenticated}
                                            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 ${isSubmitting || !isAuthenticated
                                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30'
                                                }`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>در حال ثبت...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>ثبت و تکمیل سفارش</span>
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>

                                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                            <Shield className="w-4 h-4 text-green-500" />
                                            <span>پرداخت امن و محافظت شده</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <Truck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                    <p className="text-xs text-gray-600 font-medium">ارسال سریع</p>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                    <p className="text-xs text-gray-600 font-medium">ضمانت اصالت</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
