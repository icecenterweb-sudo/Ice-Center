export const toPersianDigits = (value: string | number): string => {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    return str.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

export const toEnglishDigits = (value: string | number): string => {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    return str.replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
}
