import { LegalPage, H2, Ul } from "@/components/legal";
import { legal } from "@/lib/legal";
export const metadata = { title: "Terms of Service · Orbit Workspace" };
export default function Terms() {
  return (<LegalPage title="Terms of Service">
    <p>These terms govern your use of {legal.product} (“Orbit”), operated by {legal.company}. By creating an account or using Orbit, you agree to them. If you use Orbit for an organization, you confirm you have authority to accept these terms for it.</p>
    <H2>1. Early access</H2>
    <p>Orbit is in early access. Features may change, and the service may be unavailable or contain errors. We do not promise any particular level of uptime.</p>
    <H2>2. Your account</H2>
    <p>You must give accurate information, keep your sign-in details secure, and be responsible for activity under your account. Tell us promptly if you think your account has been compromised.</p>
    <H2>3. Organizations and administrators</H2>
    <p>Organization owners and admins control their workspace, including who can join, each member’s role, and the content stored there. Members should understand that their organization’s administrators can access workspace content.</p>
    <H2>4. Your content</H2>
    <p>You keep ownership of the content you add to Orbit. You give us permission to store, process and display it as needed to run the service for you and your organization, including sending the relevant parts to our AI provider when you use AI features. You are responsible for your content and for having the right to use it.</p>
    <H2>5. Acceptable use</H2>
    <p>You agree not to:</p>
    <Ul><li>break the law or infringe other people’s rights;</li><li>upload malicious code or try to disrupt or gain unauthorized access to the service or other people’s data;</li><li>probe or test for vulnerabilities without our written permission;</li><li>use automated means to overload the service or to scrape it;</li><li>use the service to send spam or to store or share unlawful or abusive content.</li></Ul>
    <H2>6. AI features</H2>
    <p>The AI assistant can produce inaccurate or incomplete results. It only proposes changes, and nothing is applied until you approve it. You are responsible for reviewing proposals before approving them and for decisions you make using AI output.</p>
    <H2>7. Fees</H2>
    <p>Orbit is currently free during early access. If we introduce paid plans, we will tell you in advance and you will not be charged without agreeing to it.</p>
    <H2>8. Suspension and termination</H2>
    <p>You can stop using Orbit at any time. We may suspend or end access if you break these terms or put the service or others at risk. To delete your account and data, contact {legal.email}.</p>
    <H2>9. Disclaimers</H2>
    <p>Orbit is provided “as is” and “as available”, without warranties of any kind to the extent the law allows, including warranties of fitness for a particular purpose or that the service will be uninterrupted or error-free.</p>
    <H2>10. Limitation of liability</H2>
    <p>To the extent the law allows, {legal.company} is not liable for indirect, incidental or consequential damages, or for lost profits, data or business, and its total liability for any claim is limited to [the amount you paid us in the last 12 months, or a fixed amount]. [Have a lawyer confirm this wording for your jurisdiction.]</p>
    <H2>11. Changes</H2>
    <p>We may update these terms. We will change the date above and, for significant changes, notify you. Continuing to use Orbit after a change means you accept it.</p>
    <H2>12. Governing law</H2>
    <p>These terms are governed by the laws of {legal.governingLaw}. [Add where disputes will be resolved after legal review.]</p>
    <H2>13. Contact</H2>
    <p>{legal.company}<br />{legal.address}<br />{legal.email}</p>
  </LegalPage>);
}
