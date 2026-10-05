import ResetPasswordForm from '../auth/ResetPasswordForm'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="bg-white text-black">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-6 text-center">Reset password</h1>
        <div className="rounded-xl border bg-white p-6 shadow-sm md:p-8">
          <ResetPasswordForm token={token ?? ''} />
        </div>
      </div>
    </div>
  )
}
