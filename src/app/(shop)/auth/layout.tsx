export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Distraction-free layout - no header/footer
    return (
        <div className="min-h-screen">
            {children}
        </div>
    )
}
