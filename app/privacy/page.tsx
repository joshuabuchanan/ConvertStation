/* eslint-disable react/no-unescaped-entities */
const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME || "the ConvertStation operator";
const legalContact = process.env.NEXT_PUBLIC_LEGAL_CONTACT || "the legal contact configured by the operator";

export default function PrivacyPage() {
	return <article className="info-page">
		<p className="eyebrow">PRIVACY</p>
		<h1>Privacy policy</h1>
		<p>Effective date: September 21, 2026. ConvertStation is operated by {legalName}. Privacy contact: {legalContact}.</p>
		<section><h2>Files and temporary processing</h2><p>Images are normally processed in the browser. Audio and video use FFmpeg WebAssembly in the browser. Document, archive, ebook, presentation, spreadsheet, and vector conversions upload the selected file to the server route, where local conversion tools process them. Temporary files are intended to be removed after processing, but the service is not an archival or backup system. Highly sensitive files should not be uploaded unless these limits are accepted.</p></section>
		<section><h2>Browser storage</h2><p>Conversion history and the image quality preference are stored in browser localStorage. The app does not include an account system or application database by default. The History page or browser storage can be cleared to remove those records.</p></section>
		<section><h2>Third-party resources</h2><p>When audio or video conversion starts, the app may fetch FFmpeg WebAssembly assets from unpkg. The hosting provider may also process normal HTTP request metadata such as IP address, timestamps, and error logs according to its policies.</p></section>
		<section><h2>Cookies and analytics</h2><p>The project does not include advertising cookies or analytics integration by default. The theme provider may use browser preferences to remember the selected theme.</p></section>
		<section><h2>Rights and requests</h2><p>Contact {legalContact} for privacy questions, deletion requests, or concerns about a file. The operator should update this policy if the deployment adds accounts, analytics, cookies, external processors, or different retention practices.</p></section>
	</article>;
}
