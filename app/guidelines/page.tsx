import Link from 'next/link'
import { Button } from "@/app/components/ui/button"
import Header from '@/app/components/header'

export default function TermsAndPrivacyPage() {
  return (
    <div>
      <Header />
      <section className="relative py-14 pt-48 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-11">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
              Guidelines
            </h2>
            <p className="mt-4 text-lg text-gray-400 leading-relaxed max-w-md mx-auto">
              Our commitment to transparency and user protection. Review our terms and privacy policy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-200">Terms of Service</h3>
              <p className="text-gray-400">
                By using our service, you agree to abide by these terms. Our service is provided "as is" without warranties of any kind.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full hover:bg-gray-700 hover:text-white transition duration-200"
              >
                <Link href="/guidelines/terms">Read full Terms of Service</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-200">Privacy Policy</h3>
              <p className="text-gray-400">
                We collect and use your data to provide and improve our service. Your privacy is important to us.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full hover:bg-gray-700 hover:text-white transition duration-200"
              >
                <Link href="/guidelines/privacy">Read full Privacy Policy</Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              For any questions regarding our terms or privacy policy, please contact our support team.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
