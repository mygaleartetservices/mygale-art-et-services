import Link from 'next/link'
import ForgotPasswordForm from '../auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="bg-white text-black">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2 text-center">Forgot password</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <div className="rounded-xl border bg-white p-6 shadow-sm md:p-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="text-[#003366] underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
