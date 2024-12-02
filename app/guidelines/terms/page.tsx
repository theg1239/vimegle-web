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
              Last Updated: December 2, 2024
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
                4. User Content and Conduct; User Disputes
              </h3>
              <p className="text-gray-400">
                The Services provide communication channels designed to enable users to communicate with other users. Vimegle does not exert any control over the individuals you interact with. We have no obligation to monitor these communication channels but may, in our discretion, do so in connection with providing the Services. Vimegle may also terminate, suspend, or ban your access to and use of the Services at any time, without notice, for any reason in our sole discretion.
              </p>
              <p className="text-gray-400">
                You acknowledge and agree that any user content, including without limitation text chats and video chats, is not created, endorsed, or controlled by Vimegle. Vimegle will not under any circumstances be liable for any user content or activity within the Services. Vimegle is not responsible for information or content that you choose to share within or through the Services, nor is Vimegle responsible for the content or actions of other users of the Services. Vimegle is not responsible for maintaining copies of any information or communications you choose to submit to or through the Services.
              </p>
              <p className="text-gray-400">
                You are solely responsible for your interaction with other users of the Services and other parties that you come in contact with through the Services. To the fullest extent permitted by applicable law, Vimegle hereby disclaims any and all liability to you or any third party relating to your use of the Services. You acknowledge and agree that Vimegle does not have any special relationship with you as an end user, and as such, Vimegle does not owe you any duty to protect you from the acts of other users or other third parties.
              </p>
              <p className="text-gray-400">
                Parental control protections (such as computer hardware, software, or filtering services) are commercially available and may assist you in limiting minors’ access to materials that may be harmful to or inappropriate for minors. There are a number of websites that provide information about such parental control protections, including but not limited to <a href="https://www.connectsafely.org/controls/" className="underline text-blue-400 hover:text-blue-600">https://www.connectsafely.org/controls/</a>.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                5. User Responsibilities
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
                <li>
                  Use, display, mirror, or frame the Service or any individual element within the Service, the Vimegle name, any Vimegle trademark, logo, or other proprietary information, or the layout and design of any page or form contained on a page in the Service, without Vimegle’s express written consent.
                </li>
                <li>
                  Avoid, bypass, remove, deactivate, impair, descramble, or otherwise attempt to circumvent any technological measure implemented by Vimegle or any of Vimegle’s providers to protect the Service.
                </li>
                <li>
                  Modify, make derivative works of, attempt to decipher, decompile, disassemble, or reverse engineer any of the software used to provide the Service.
                </li>
                <li>
                  Take any action that damages or adversely affects, or could damage or adversely affect the performance or proper functioning of the Service.
                </li>
                <li>
                  Violate or infringe anyone else’s rights or otherwise cause or threaten harm to anyone.
                </li>
              </ul>

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

              {/* New Sections Start Here */}

              <h3 className="text-xl font-semibold text-gray-200">
                13. Use of the Services by Minors and Banned Persons
              </h3>
              <p className="text-gray-400">
                <strong>13.1 Eligibility:</strong> The Service is not available to individuals under the age of 18. By accessing or using the Service, you represent and warrant that you are at least 18 years old or the legal age of majority in your jurisdiction, whichever is higher.
              </p>
              <p className="text-gray-400">
                <strong>13.2 Banned Users:</strong> We reserve the right to ban or restrict access to the Service for any user who has previously been removed or banned for violating these Terms or engaging in prohibited activities. If you have been banned, you are not permitted to create a new account or access the Service in any other manner.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                14. Limited License to Use the Services
              </h3>
              <p className="text-gray-400">
                <strong>14.1 Grant of License:</strong> Subject to your compliance with these Terms, Vimegle grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the Service solely for your personal, non-commercial use.
              </p>
              <p className="text-gray-400">
                <strong>14.2 Restrictions:</strong> You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>Circumvent any technological measures implemented by Vimegle to protect the Service.</li>
                <li>Reproduce, distribute, or create derivative works based on the Service.</li>
                <li>Use the Service for any commercial purposes without explicit permission.</li>
                <li>Modify, reverse engineer, or decompile any part of the Service.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">
                15. Dispute Resolution: Agreement to Arbitrate
              </h3>
              <p className="text-gray-400">
                <strong>15.1 Agreement to Arbitrate:</strong> You and Vimegle agree that any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Service will be resolved exclusively through binding individual arbitration, rather than in court. Arbitration will be conducted in accordance with the rules of the American Arbitration Association (AAA) then in effect.
              </p>
              <p className="text-gray-400">
                <strong>15.2 Exceptions:</strong> Notwithstanding the Arbitration Agreement, you may seek injunctive or other equitable relief in court to protect your intellectual property rights or prevent unauthorized use of your content.
              </p>
              <p className="text-gray-400">
                <strong>15.3 Class Action Waiver:</strong> You and Vimegle agree to waive the right to participate in any class action lawsuit or class-wide arbitration against each other.
              </p>
              <p className="text-gray-400">
                <strong>15.4 Arbitration Process:</strong> The arbitration will be conducted by a single arbitrator in the state where you reside. The arbitrator’s decision will be final and binding. Each party will bear its own costs and attorney’s fees, unless otherwise required by law.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                16. Term, Termination, and Survival
              </h3>
              <p className="text-gray-400">
                <strong>16.1 Term:</strong> These Terms remain in effect while you use the Service.
              </p>
              <p className="text-gray-400">
                <strong>16.2 Termination:</strong> Vimegle may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including if you breach any part of these Terms.
              </p>
              <p className="text-gray-400">
                <strong>16.3 Survival:</strong> Upon termination, your right to use the Service will cease immediately. However, provisions related to <strong>Intellectual Property</strong>, <strong>Disclaimers</strong>, <strong>Limitation of Liability</strong>, <strong>Indemnification</strong>, <strong>Dispute Resolution</strong>, and <strong>Governing Law</strong> will survive termination.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                17. Limitation of Liability
              </h3>
              <p className="text-gray-400">
                <strong>17.1 Limitation:</strong> To the fullest extent permitted by law, Vimegle shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or related to your use of the Service.
              </p>
              <p className="text-gray-400">
                <strong>17.2 Aggregate Liability:</strong> Vimegle’s total liability for any claims arising out of or related to these Terms or the Service will not exceed $100 USD.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                18. Indemnification
              </h3>
              <p className="text-gray-400">
                You agree to defend, indemnify, and hold harmless Vimegle and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney’s fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your infringement of any rights of another.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                19. Governing Law and Venue
              </h3>
              <p className="text-gray-400">
                These Terms and any disputes arising under them shall be governed by the laws of the State of Delaware, United States, without regard to its conflict of law principles. You agree to submit to the personal and exclusive jurisdiction of the courts located in Delaware for the resolution of any disputes not subject to arbitration.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                20. Severability
              </h3>
              <p className="text-gray-400">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                21. Entire Agreement
              </h3>
              <p className="text-gray-400">
                These Terms constitute the entire agreement between you and Vimegle regarding your use of the Service and supersede all prior agreements and understandings, whether written or oral, relating to the subject matter.
              </p>
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
