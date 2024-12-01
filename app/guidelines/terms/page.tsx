import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import Header from '@/app/components/header';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative py-14 pt-24 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
              Terms of Service
            </h2>
            <p className="mt-2 text-lg text-gray-400">
              Last Updated: December 1, 2024
            </p>
          </div>

          <ScrollArea className="h-96 bg-black p-6 rounded-lg overflow-y-auto">
            <div className="prose prose-invert prose-gray">
              <h3 className="text-xl font-semibold text-gray-200">
                1. Acceptance of Terms
              </h3>
              <p className="text-gray-400">
                By accessing or using our Service, you affirm that you are at
                least 18 years old or the legal age of majority in your
                jurisdiction and capable of forming a binding contract. If you
                are using our Service on behalf of an organization, you
                represent and warrant that you have the authority to bind that
                organization to these Terms. Continued use of the Service
                indicates your acceptance of these Terms and any future updates.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                2. Description of Service
              </h3>
              <p className="text-gray-400">
                Vimegle provides real-time, anonymous video and text chat
                services connecting users randomly for conversation ("Service").
                No account creation is required to use the Service. The Service
                is intended solely for personal, non-commercial use.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                3. No Affiliation Disclaimer
              </h3>
              <p className="text-gray-400">
                Vimegle is an independent platform and does not claim or intend
                to be affiliated, associated, authorized, endorsed by, or in any
                way officially connected with any institution, organization,
                company, or individual unless explicitly stated. The names,
                logos, or any other proprietary identifiers used in connection
                with the Service are solely for descriptive purposes and should
                not imply any association, partnership, or endorsement. Any
                implications to the contrary are expressly disclaimed.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                4. User Responsibilities
              </h3>
              <p className="text-gray-400">
                <strong>Lawful Use:</strong> You agree to use the Service only
                for lawful purposes and in accordance with these Terms. Your
                use must comply with all applicable laws, regulations, and
                guidelines in your jurisdiction.
              </p>

              <p className="text-gray-400">
                <strong>Prohibited Conduct:</strong> You must not:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  Engage in harassment, hate speech, or any form of abusive
                  behavior.
                </li>
                <li>
                  Share, distribute, or transmit illegal, harmful, offensive,
                  or infringing content.
                </li>
                <li>
                  Attempt to gain unauthorized access to our systems, or disrupt
                  the integrity of the Service.
                </li>
                <li>
                  Use automated means or scripts to interact with the Service,
                  unless explicitly authorized by us.
                </li>
                <li>
                  Impersonate another person or falsely represent your identity
                  or affiliation.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">
                5. User-Generated Content
              </h3>
              <p className="text-gray-400">
                Vimegle is a platform that facilitates user interactions and does
                not control or endorse any content transmitted by users. You
                acknowledge and agree that all content is the sole responsibility
                of the person who originated it. Vimegle and its affiliates will
                not be held responsible or liable for any content, including but
                not limited to errors, omissions, or any loss or damage incurred
                as a result of the use of any content made available via the
                Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                6. No Account Creation
              </h3>
              <p className="text-gray-400">
                Our Service does not require users to create an account. By
                using the Service, you agree that we may collect certain
                non-identifiable information to improve functionality or comply
                with legal requirements, as outlined in our{' '}
                <Link
                  href="/guidelines/privacy"
                  className="underline text-blue-400 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                7. Intellectual Property
              </h3>
              <p className="text-gray-400">
                <strong>Ownership:</strong> All content, features, and
                functionality of the Service, including but not limited to text,
                graphics, logos, and software, are owned by or licensed to us
                and are protected by intellectual property laws. Any
                unauthorized use of these materials is strictly prohibited.
              </p>

              <p className="text-gray-400">
                <strong>Limited License:</strong> We grant you a limited,
                non-exclusive, non-transferable, and revocable license to access
                and use the Service for personal, non-commercial purposes only.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                8. Disclaimers
              </h3>
              <p className="text-gray-400">
                <strong>As-Is Basis:</strong> The Service is provided on an "AS
                IS" and "AS AVAILABLE" basis, with no warranties of any kind,
                either express or implied, including warranties of
                merchantability or fitness for a particular purpose.
              </p>

              <p className="text-gray-400">
                <strong>Liability Limitations:</strong> To the fullest extent
                permitted by applicable law, we disclaim all responsibility for
                damages arising from your use of the Service, including data
                loss, service interruptions, or unauthorized access to user
                communications.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                9. Indemnification
              </h3>
              <p className="text-gray-400">
                You agree to indemnify and hold harmless Vimegle, its affiliates,
                officers, directors, employees, and agents from any claims,
                liabilities, damages, losses, and expenses arising out of or in
                any way connected with your access to or use of the Service or
                violation of these Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                10. Governing Law
              </h3>
              <p className="text-gray-400">
                These Terms and any disputes arising under them shall be
                governed by the laws of the State of Delaware, United States,
                without regard to its conflict of law principles. Where
                required, the Service also complies with applicable laws of
                jurisdictions where it is accessed, including relevant
                obligations under data protection and content moderation laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                11. Changes to Terms
              </h3>
              <p className="text-gray-400">
                We may modify these Terms at any time without prior notice. It
                is your responsibility to review these Terms periodically. Your
                continued use of the Service after changes are posted will
                signify your acceptance of those changes.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                12. Contact Us
              </h3>
              <p className="text-gray-400">
                For questions or concerns regarding these Terms, please contact
                us at:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:support@vimegle.com"
                    className="underline text-blue-400 hover:text-blue-600"
                  >
                    support@vimegle.com
                  </a>
                </li>
              </ul>
            </div>
          </ScrollArea>

          <div className="mt-6 text-center">
            <Button
              asChild
              variant="outline"
              className="px-6 py-3 hover:bg-gray-700 hover:text-white transition duration-200"
            >
              <Link href="/guidelines">Back to Guidelines</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
