export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg grid min-h-screen place-items-center px-6 py-12">
      {children}
    </div>
  );
}
