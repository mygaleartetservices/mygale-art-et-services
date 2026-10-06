import LoginForm from '../auth/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="bg-white text-black">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign in</h1>
        <div className="rounded-xl border bg-white p-6 shadow-sm md:p-8">
          <LoginForm next={next ?? null} />
        </div>
      </div>
    </div>
  )
}
