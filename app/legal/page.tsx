const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME || "the ConvertStation operator";
const legalContact = process.env.NEXT_PUBLIC_LEGAL_CONTACT || "the legal contact configured by the operator";

export default function LegalPage() {
  return <article className="info-page">
    <p className="eyebrow">LEGAL</p>
    <h1>Legal and ownership</h1>
    <p>ConvertStation is operated by {legalName}. Legal contact: {legalContact}.</p>
    <section><h2>Copyright and permitted reuse</h2><p>The original ConvertStation source code, layout, visual design, workflows, and technical setup may be copied, modified, adapted, recreated, imitated, and redistributed under the ConvertStation Permissive Software and Design License in the repository&apos;s LICENSE file. Any reuse must use a different name and must remove ConvertStation branding. Third-party packages, logos, fonts, images, and sample files remain subject to their own licenses and ownership rights.</p></section>
    <section><h2>Brand and naming</h2><p>ConvertStation, the ConvertStation name, and the ConvertStation logo are reserved project branding. Permission to reuse the software or imitate its design does not include permission to use that name, logo, or branding, or to imply sponsorship, approval, affiliation, or official status. A reused or modified version must be presented under another name and with its own branding. This notice does not claim that a trademark is registered.</p></section>
    <section><h2>Copyright concerns</h2><p>For a copyright or trademark concern, contact {legalContact} with the affected material, the basis for ownership, and contact details. The operator will review valid notices and may remove or correct material when appropriate.</p></section>
    <section><h2>Third-party software</h2><p>Conversion engines and JavaScript packages are distributed under their respective licenses. Review package metadata and the deployment image dependencies before redistributing a hosted or modified version.</p></section>
  </article>;
}
