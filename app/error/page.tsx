export default function ErrorPage() {
  return (
    <section className="relative py-14 pt-48 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="relative z-10 container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-11">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-600">
            Access Denied
          </h2>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed max-w-md mx-auto">
            It seems like you're trying to access this page from an unsupported location. Our website is only available in supported regions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-200">Why am I seeing this?</h3>
            <p className="text-gray-400">
              Our website restricts access from certain locations to comply with local regulations and policies.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-200">Need Access?</h3>
            <p className="text-gray-400">
              If you believe this is a mistake or require assistance, please contact our support team at support@vimegle.com
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
