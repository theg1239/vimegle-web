import Link from 'next/link'
import { Button } from "@/app/components/ui/button"
import { ScrollArea }from "@/app/components/ui/scroll-area" 
import Header from '@/app/components/header' 

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
              Last Updated: November 26, 2024
            </p>
          </div>

          {/* Scrollable Privacy Policy Content */}
          <ScrollArea className="h-96 bg-black p-6 rounded-lg overflow-y-auto">
            <div className="prose prose-invert prose-gray">
              <h3 className="text-xl font-semibold text-gray-200">1. Information We Collect</h3>
              <p className="text-gray-400">
                Even though we do not require account creation, we may collect the following types of information:
              </p>

              <h4 className="text-lg font-semibold text-gray-200">Personal Information:</h4>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>IP Address:</strong> We automatically collect your IP address when you use the Service.</li>
                <li><strong>Browser Information:</strong> Details about your browser type, version, and settings.</li>
                <li><strong>Device Information:</strong> Information about the device you use to access the Service, including operating system and device type.</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-200">Non-Personal Information:</h4>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>Usage Data:</strong> Information about how you interact with the Service, such as the pages you visit, the time and duration of your visits, and other diagnostic data.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on the Service and hold certain information.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">2. How We Use Your Information</h3>
              <p className="text-gray-400">
                We use the collected information for various purposes, including:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>Providing the Service:</strong> To facilitate real-time communication between users.</li>
                <li><strong>Improving the Service:</strong> To understand how users interact with the Service and to improve its functionality and user experience.</li>
                <li><strong>Security:</strong> To monitor and protect the Service from unauthorized access, attacks, or other security threats.</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and enforce our Terms of Service.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">3. Sharing Your Information</h3>
              <p className="text-gray-400">
                We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as hosting, data analysis, and security.</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200">4. Data Security</h3>
              <p className="text-gray-400">
                We implement appropriate technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">5. Data Retention</h3>
              <p className="text-gray-400">
                We retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically, since we do not store user data beyond what is necessary to display messages via the socket, any transient data is not retained beyond the active session.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">6. Your Rights</h3>
              <p className="text-gray-400">
                Depending on your jurisdiction, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>Access:</strong> The right to request access to your personal information.</li>
                <li><strong>Correction:</strong> The right to request correction of inaccurate or incomplete personal information.</li>
                <li><strong>Deletion:</strong> The right to request deletion of your personal information under certain conditions.</li>
                <li><strong>Restriction:</strong> The right to request the restriction of processing your personal information.</li>
                <li><strong>Objection:</strong> The right to object to the processing of your personal information.</li>
                <li><strong>Data Portability:</strong> The right to receive your personal information in a structured, commonly used, and machine-readable format.</li>
              </ul>
              <p className="text-gray-400">
                To exercise any of these rights, please contact us using the contact information provided below.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">7. Children's Privacy</h3>
              <p className="text-gray-400">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have inadvertently received personal information from a child under 18, we will take steps to delete such information promptly.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">8. International Transfers</h3>
              <p className="text-gray-400">
                Your information may be transferred to and maintained on servers located outside your country of residence. By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your own.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">9. Third-Party Links</h3>
              <p className="text-gray-400">
                Our Service may contain links to third-party websites or services that are not operated by us. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>

              <h3 className="text-xl font-semibold text-gray-200">10. Changes to This Privacy Policy</h3>
              <p className="text-gray-400">
                We may update our Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this document. Your continued use of the Service after such changes constitutes your acceptance of the new Privacy Policy.
              </p>

              {/* <h3 className="text-xl font-semibold text-gray-200">11. Contact Us</h3>
              <p className="text-gray-400">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-disc list-inside text-gray-400">
                <li><strong>Email:</strong> <a href="mailto:privacy@vimegle.com" className="underline text-blue-400 hover:text-blue-600">privacy@vimegle.com</a></li>
                <li><strong>Address:</strong> [Your Physical Address, if applicable]</li>
              </ul> */}
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
  )
}
