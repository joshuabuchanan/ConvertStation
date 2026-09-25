const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME || "the ConvertStation operator";
const legalContact = process.env.NEXT_PUBLIC_LEGAL_CONTACT || "the legal contact configured by the operator";

export default function TermsPage() {
  return <article className="info-page">
    <p className="eyebrow">TERMS</p>
    <h1>Terms of use</h1>
    <p>These terms describe use of ConvertStation, operated by {legalName}. Contact: {legalContact}.</p>
    <section><h2>Service</h2><p>ConvertStation provides file conversion tools on an as-available basis. Conversion results can vary by source file, installed engine, and target format. The uploader is responsible for keeping an original copy of every source file.</p></section>
    <section><h2>Acceptable use</h2><p>Files must not be uploaded or the service used to violate law, infringe intellectual property or privacy rights, distribute malware, bypass access controls, or interfere with the service. Only files authorized for processing may be uploaded.</p></section>
    <section><h2>Files and results</h2><p>Rights in uploaded files remain with the rights holder. The operator receives only the limited technical permission needed to receive and convert a file. Temporary server files are intended to be deleted after each request, but the service must not be treated as a guaranteed archival or backup system.</p></section>
    <section><h2>Disclaimer and liability</h2><p>The service is provided &quot;as is&quot; to the extent permitted by law. The operator does not guarantee uninterrupted availability, error-free conversion, or preservation of formatting. To the extent permitted by law, the operator is not liable for loss caused by reliance on conversion results or by files uploaded to the service.</p></section>
    <section><h2>Changes</h2><p>These terms may be updated when the service changes. The effective date shown with the published policy should be updated whenever material terms change.</p></section>
  </article>;
}
