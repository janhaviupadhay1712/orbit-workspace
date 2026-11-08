import { LegalPage, H2, Ul } from "@/components/legal";
import { legal } from "@/lib/legal";
export const metadata = { title: "Privacy Policy · Orbit Workspace" };
export default function Privacy() {
  return (<LegalPage title="Privacy Policy">
    <p>This policy explains what information {legal.product} (“Orbit”, “we”) collects, how we use it, and the choices you have. Orbit is operated by {legal.company}, {legal.address}.</p>
    <H2>1. Information we collect</H2>
    <Ul><li><b>Account information:</b> your email address, name and profile photo. If you sign in with Google or GitHub, we receive your email, name and photo from them. We never receive your Google or GitHub password. If you sign up with a password, it is stored in hashed form by our authentication provider and we cannot read it.</li>
      <li><b>Workspace content:</b> organizations, projects, tasks, comments, invitations and similar content that you or your teammates add, plus an activity log of actions taken in the workspace.</li>
      <li><b>AI requests:</b> the messages you type to the AI assistant, and the workspace records needed to answer them.</li>
      <li><b>Waitlist information:</b> your email address, an optional answer about the tools you use today, and a short tag recording which link you came from.</li>
      <li><b>Technical data:</b> our hosting and infrastructure providers automatically process data such as IP address, browser type and request times to deliver the service and keep it secure.</li></Ul>
    <H2>2. How we use information</H2>
    <Ul><li>To provide and operate Orbit, including signing you in and letting teammates collaborate.</li><li>To run the AI features you choose to use.</li><li>To send messages you need, such as invitations and account notices, and to contact people on our waitlist about Orbit.</li><li>To protect the service against abuse, fix bugs and improve reliability.</li></Ul>
    <p>We do not sell your personal information.</p>
    <H2>3. AI features</H2>
    <p>When you use the AI assistant, we send your request and the workspace data needed to answer it (for example task titles, project names and due dates) to our AI provider, {legal.aiProvider}. The assistant can only access data that you yourself can access, and it cannot change anything until you approve a preview. AI can make mistakes, so please review what it proposes. How the AI provider handles data is governed by that provider’s own terms.</p>
    <H2>4. Who we share information with</H2>
    <p>We use service providers to run Orbit. They process data on our behalf:</p>
    <Ul><li><b>Supabase</b> for the database, authentication and file storage (our project is hosted in {legal.hostingRegion}).</li><li><b>Vercel</b> for hosting the application.</li><li><b>{legal.aiProvider}</b> for AI features.</li><li><b>Google or GitHub</b>, if you choose to sign in with them.</li><li>[Email delivery provider, once added]</li></Ul>
    <p>We may also disclose information if the law requires it.</p>
    <H2>5. Within your organization</H2>
    <p>Content in a workspace is visible to that organization’s members according to their role. Organization owners and admins can invite and remove members and can see the names, emails and photos of members, and the content they add. If you join someone else’s organization, that organization’s administrators control that workspace.</p>
    <H2>6. Cookies</H2>
    <p>We use only essential cookies: one to keep you signed in and one to remember your sidebar preference. We do not currently use advertising or analytics cookies. If that changes, we will update this policy.</p>
    <H2>7. Retention and deletion</H2>
    <p>We keep your account and workspace data while your account is active. We do not yet offer a self-service tool to delete or export your data. To delete your account, remove your waitlist entry, or request a copy of your data, email us at {legal.email}. Backups may keep copies for a limited time [state how long] after deletion.</p>
    <H2>8. Security</H2>
    <p>We use reputable infrastructure providers, encrypt data in transit with HTTPS, and keep each organization’s data separated using database-level access rules. No system is completely secure, so we cannot guarantee absolute security.</p>
    <H2>9. Where data is processed</H2>
    <p>Our database is hosted in {legal.hostingRegion}. Our AI provider and other service providers may process data in other countries, including the United States.</p>
    <H2>10. Your rights</H2>
    <p>Depending on where you live, you may have the right to access, correct, delete or export your personal information, to object to or restrict some processing, to withdraw consent, and to complain to a data protection authority. Contact us at {legal.email} to exercise these rights. [Add region-specific wording after legal review, for example for the EU GDPR or India’s Digital Personal Data Protection Act.]</p>
    <H2>11. Children</H2>
    <p>Orbit is not intended for people under [16 or 18]. We do not knowingly collect their information.</p>
    <H2>12. Changes to this policy</H2>
    <p>We may update this policy. We will change the date above and, for significant changes, notify you.</p>
    <H2>13. Contact</H2>
    <p>{legal.company}<br />{legal.address}<br />{legal.email}</p>
  </LegalPage>);
}