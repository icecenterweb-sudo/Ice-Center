'use client';

import { OTPInput, SlotProps } from 'input-otp';

interface OTPInputFieldProps {
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    disabled?: boolean;
}

function Slot(props: SlotProps) {
    const baseClasses = 'relative w-12 h-14 text-2xl flex items-center justify-center border rounded-xl bg-gray-50 transition-all duration-200';
    const activeClasses = props.isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200';

    return (
        <div className={`${baseClasses} ${activeClasses}`}>
            {props.char !== null && (
                <span className="text-gray-800 font-bold">{props.char}</span>
            )}
            {props.char === null && props.isActive && (
                <div className="absolute w-0.5 h-6 bg-blue-500 animate-pulse" />
            )}
            {props.char === null && !props.isActive && (
                <span className="text-gray-300">•</span>
            )}
        </div>
    );
}

export default function OTPInputField({
    value,
    onChange,
    maxLength = 4,
    disabled = false,
}: OTPInputFieldProps) {
    return (
        <OTPInput
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            disabled={disabled}
            containerClassName="group flex justify-center gap-2 rtl:flex-row-reverse"
            render={({ slots }) => (
                <>
                    {slots.map((slot, idx) => (
                        <Slot key={idx} {...slot} />
                    ))}
                </>
            )}
        />
    );
}

