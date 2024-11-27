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
              Last Updated: November 26, 2024
            </p>
          </div>

          <ScrollArea className="h-96 bg-black p-6 rounded-lg overflow-y-auto">
            <div className="prose prose-invert prose-gray">
              <h3 className="text-xl font-semibold text-gray-200">
                1. Acceptance of Terms
              </h3>
              <p className="text-gray-400">
                By accessing or using our Service, you affirm that you are at
                least 18 years old and capable of forming a binding contract. If
                you are using our Service on behalf of an organization, you
                represent and warrant that you have the authority to bind that
                organization to these Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                2. Description of Service
              </h3>
              <p className="text-gray-400">
                Vimegle provides real-time, anonymous video and text chat
                services connecting users randomly for conversation ("Service").
                No account creation is required to use the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                3. User Responsibilities
              </h3>
              <p className="text-gray-400">
                <strong>Lawful Use:</strong> You agree to use the Service only
                for lawful purposes and in accordance with these Terms.
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
                  Share or distribute illegal, harmful, or infringing content.
                </li>
                <li>
                  Attempt to gain unauthorized access to our systems or other
                  users' data.
                </li>
                <li>
                  Use automated means to access or interact with the Service.
                </li>
                <li>
                  Impersonate any person or entity or falsely represent your
                  affiliation with a person or entity.
                </li>
              </ul>

              <p className="text-gray-400">
                <strong>Content Standards:</strong> You are solely responsible
                for all content you transmit through the Service. We do not
                endorse any content but reserve the right to remove content that
                violates these Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                4. No Account Creation
              </h3>
              <p className="text-gray-400">
                Our Service does not require users to create an account. By
                using the Service, you acknowledge that we may collect certain
                information as described in our{' '}
                <Link
                  href="/guidelines/privacy"
                  className="underline text-blue-400 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                5. Intellectual Property
              </h3>
              <p className="text-gray-400">
                <strong>Ownership:</strong> All content, features, and
                functionality of the Service, including but not limited to text,
                graphics, logos, and software, are owned by or licensed to us
                and are protected by intellectual property laws.
              </p>

              <p className="text-gray-400">
                <strong>Limited License:</strong> We grant you a limited,
                non-exclusive, non-transferable, and revocable license to access
                and use the Service for personal, non-commercial purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                6. Termination
              </h3>
              <p className="text-gray-400">
                We reserve the right to suspend or terminate your access to the
                Service, without prior notice or liability, for any reason,
                including if you breach these Terms. Upon termination, your
                right to use the Service will immediately cease.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                7. Disclaimers
              </h3>
              <p className="text-gray-400">
                <strong>As-Is Basis:</strong> The Service is provided on an "AS
                IS" and "AS AVAILABLE" basis without warranties of any kind,
                either express or implied.
              </p>

              <p className="text-gray-400">
                <strong>No Liability:</strong> We are not liable for any direct,
                indirect, incidental, consequential, or punitive damages arising
                out of your use of the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                8. Limitation of Liability
              </h3>
              <p className="text-gray-400">
                To the fullest extent permitted by law, Vimegle shall not be
                liable for any damages of any kind arising from your use of the
                Service, including but not limited to direct, indirect,
                incidental, punitive, and consequential damages.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                9. Indemnification
              </h3>
              <p className="text-gray-400">
                You agree to defend, indemnify, and hold harmless Vimegle, its
                affiliates, officers, directors, employees, and agents from and
                against any claims, liabilities, damages, losses, and expenses
                arising out of or in any way connected with your access to or
                use of the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                10. Governing Law
              </h3>
              <p className="text-gray-400">
                These Terms shall be governed and construed in accordance with
                the laws of{' '}
                <strong>of the state of Delaware, United States</strong>,
                without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                11. Dispute Resolution
              </h3>
              <p className="text-gray-400">
                Any disputes arising out of or relating to these Terms shall be
                resolved through binding arbitration in accordance with the
                rules of the American Arbitration Association.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                12. Changes to Terms
              </h3>
              <p className="text-gray-400">
                We reserve the right to modify or replace these Terms at any
                time. We will provide notice of these changes by updating the
                "Last Updated" date at the top of this document. Your continued
                use of the Service after such changes constitutes your
                acceptance of the new Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                13. Contact Us
              </h3>
              <p className="text-gray-400">
                If you have any questions about these Terms, please contact us
                at:
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
