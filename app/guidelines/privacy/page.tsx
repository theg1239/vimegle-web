import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import Header from '@/app/components/header';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative py-14 pt-24 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
              Privacy Policy
            </h2>
            <p className="mt-2 text-lg text-gray-400">
              Last Updated: December 1, 2024
            </p>
          </div>

          {/* Scrollable Privacy Policy Content */}
          <ScrollArea className="h-96 bg-black p-6 rounded-lg overflow-y-auto">
            <div className="prose prose-invert prose-gray">
              <h3 className="text-xl font-semibold text-gray-200">
                1. Information We Collect
              </h3>
              <p className="text-gray-400">
                Vimegle is committed to respecting your privacy. While account
                creation is not required, we collect limited information to
                provide and improve the Service. This includes:
              </p>

              <h4 className="text-lg font-semibold text-gray-200">
                Personal Information:
              </h4>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Email Address:</strong> Collected only if you choose
                  to verify your identity for enhanced Service features. This
                  is used solely for verification purposes and communication
                  related to the Service.
                </li>
                <li>
                  <strong>IP Address:</strong> Automatically collected for
                  network management, fraud prevention, and compliance.
                </li>
                <li>
                  <strong>Browser and Device Information:</strong> Such as
                  browser type, operating system, device model, and settings to
                  optimize Service compatibility.
                </li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-200">
                Non-Personal Information:
              </h4>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Usage Data:</strong> Data related to user interactions
                  with the Service (e.g., features accessed, timestamps).
                </li>
                <li>
                  <strong>Cookies and Tracking:</strong> Temporary cookies or
                  tracking mechanisms for session continuity and performance
                  metrics.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">
                2. How We Use Your Information
              </h3>
              <p className="text-gray-400">
                The collected information is used for:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Service Delivery:</strong> Facilitating real-time
                  communication between users and verifying user identity when
                  applicable.
                </li>
                <li>
                  <strong>Improvement:</strong> Enhancing the Service’s
                  reliability and usability through analytics and diagnostics.
                </li>
                <li>
                  <strong>Security:</strong> Detecting, mitigating, and
                  preventing fraud or malicious activities.
                </li>
                <li>
                  <strong>Compliance:</strong> Ensuring adherence to applicable
                  legal and regulatory frameworks.
                </li>
                <li>
                  <strong>Communication:</strong> Sending essential updates or
                  Service-related notifications if you choose to verify with
                  your email.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">
                3. Sharing Your Information
              </h3>
              <p className="text-gray-400">
                We respect your privacy and limit sharing of your information to
                the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Service Providers:</strong> Trusted third-party
                  vendors assisting in operations such as hosting, analytics, or
                  security.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> When required by law, legal
                  processes, or governmental requests.
                </li>
                <li>
                  <strong>Business Transactions:</strong> In cases of mergers,
                  acquisitions, or sales, information may be transferred under
                  confidentiality agreements.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">
                4. Data Security
              </h3>
              <p className="text-gray-400">
                We implement industry-standard measures, including encryption
                and access controls, to protect your data. While no system can
                guarantee absolute security, we continuously review and enhance
                our practices to safeguard your information.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                5. Data Retention
              </h3>
              <p className="text-gray-400">
                Information is retained only for as long as necessary to fulfill
                its intended purpose, comply with legal obligations, or resolve
                disputes. For email addresses, they are stored only as long as
                needed for verification and communication purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                6. Your Rights
              </h3>
              <p className="text-gray-400">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Access:</strong> Request a copy of the data we have
                  collected.
                </li>
                <li>
                  <strong>Rectification:</strong> Correct inaccuracies in your
                  data.
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your data under
                  certain conditions.
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured, commonly used, machine-readable format.
                </li>
              </ul>
              <p className="text-gray-400">
                To exercise these rights, contact us at the email provided
                below. Verification may be required for security purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                7. Children's Privacy
              </h3>
              <p className="text-gray-400">
                The Service is not intended for use by individuals under the age
                of 18. We do not knowingly collect personal information from
                anyone under 18. If we learn that we have inadvertently
                collected such data, it will be promptly deleted.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                8. International Transfers
              </h3>
              <p className="text-gray-400">
                Data may be transferred to and processed in countries outside
                your jurisdiction. By using the Service, you consent to such
                transfers and acknowledge that data protection laws in these
                countries may differ from your own.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                9. Third-Party Links
              </h3>
              <p className="text-gray-400">
                Our Service may link to external websites or services. We do not
                control or endorse their content and are not responsible for
                their privacy practices. Review their policies before sharing
                information.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                10. Cookies Policy
              </h3>
              <p className="text-gray-400">
                Cookies are small text files stored on your device. They help us
                understand user behavior and improve our Service. By continuing
                to use the Service, you consent to our use of cookies unless you
                disable them in your browser settings.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                11. Changes to This Privacy Policy
              </h3>
              <p className="text-gray-400">
                We reserve the right to modify this Privacy Policy at any time.
                Material changes will be communicated via updates to the "Last
                Updated" date. Continued use of the Service constitutes
                acceptance of the revised terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">
                12. Contact Us
              </h3>
              <p className="text-gray-400">
                For inquiries or concerns regarding this Privacy Policy, contact
                us at:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:privacy@vimegle.com"
                    className="underline text-blue-400 hover:text-blue-600"
                  >
                    privacy@vimegle.com
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
