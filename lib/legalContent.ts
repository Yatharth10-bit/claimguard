export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  contactEmail?: string;
};

const CONTACT_EMAIL = "hello@claimguard.io";
export const LEGAL_POLICY_VERSION = "June 13, 2026";
const LEGAL_LAST_UPDATED = LEGAL_POLICY_VERSION;

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: LEGAL_LAST_UPDATED,
  contactEmail: CONTACT_EMAIL,
  intro:
    "These Terms of Service (\"Terms\") govern your access to and use of the ClaimGuard website, applications, and related services (collectively, the \"Service\") operated by ClaimGuard (\"ClaimGuard,\" \"we,\" \"us,\" or \"our\"). By creating an account, accessing, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
  sections: [
    {
      heading: "1. The Service",
      paragraphs: [
        "ClaimGuard is a software workspace that helps food, supplement, wellness, and related consumer-product teams review marketing claims, track regulatory updates, organize remediation tasks, and document internal review decisions.",
        "The Service uses a deterministic, rules-based analysis engine to flag potentially risky phrasing and suggest safer alternatives. Unless we expressly state otherwise in writing, claim analysis within the Service does not send your claim text to a third-party generative AI API.",
        "The Service is intended for internal marketing, compliance, and operations workflows. It is not a law firm, compliance consultancy, regulatory filing service, or substitute for professional legal review.",
      ],
    },
    {
      heading: "2. No Legal, Regulatory, or Professional Advice",
      paragraphs: [
        "ClaimGuard does not provide legal advice, regulatory advice, medical advice, or professional compliance opinions. Outputs such as risk scores, flagged phrases, safer rewrites, checklists, regulation summaries, SOP drafts, and copilot explanations are informational and educational only.",
        "You are solely responsible for determining whether any claim, label, advertisement, listing, package, website copy, social post, or other material is truthful, substantiated, permitted, and compliant in every jurisdiction and channel where you publish or sell.",
        "You should consult qualified legal, regulatory, scientific, and industry professionals before publishing high-risk claims, health-related statements, disease-related language, performance claims, or any content subject to FDA, FTC, FSSAI, EU, UK, or other authority oversight.",
      ],
    },
    {
      heading: "3. Eligibility and Accounts",
      paragraphs: [
        "You must be at least 18 years old and able to form a binding contract to use the Service. If you use the Service on behalf of a company or other entity, you represent that you have authority to bind that entity to these Terms.",
        "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us promptly at the contact email below if you suspect unauthorized access.",
        "You agree to provide accurate account information and keep it current. We may suspend or terminate accounts that contain false, misleading, or incomplete registration information.",
      ],
    },
    {
      heading: "4. Subscription Plans, Billing, and Trials",
      paragraphs: [
        "Some features require a paid subscription. Plan limits, pricing, trial periods, and included features are described on our website or in-product at the time of purchase and may change for new subscriptions with reasonable notice.",
        "Paid subscriptions are processed by our payment provider, Dodo Payments. By starting a paid plan, you authorize us and our payment provider to charge applicable subscription fees, taxes, and recurring renewals according to the plan you select.",
        "Unless otherwise stated at checkout or required by law, subscriptions renew automatically until canceled through the billing portal or by contacting support. You remain responsible for charges incurred before cancellation takes effect.",
        "We may offer free tiers, trials, or promotional pricing. We reserve the right to modify, suspend, or discontinue any plan, feature, or promotion at any time.",
        "Except where required by applicable law, fees are non-refundable once a billing period has begun. If you believe a charge was made in error, contact us within 14 days of the charge.",
      ],
    },
    {
      heading: "5. Acceptable Use",
      paragraphs: [
        "You agree not to misuse the Service. Without limiting the foregoing, you will not:",
      ],
      bullets: [
        "use the Service in violation of any applicable law, regulation, or third-party right;",
        "submit content you do not have the right to upload, review, store, or process;",
        "attempt to probe, scan, test, or breach the security of the Service or related systems;",
        "reverse engineer, scrape, resell, or commercially exploit the Service except as expressly permitted;",
        "upload malware, abusive content, or material intended to interfere with the Service;",
        "misrepresent ClaimGuard outputs as legal approval, regulatory clearance, or guaranteed compliance;",
        "use the Service to make final publish decisions without appropriate human and professional review.",
      ],
    },
    {
      heading: "6. Your Content and Responsibilities",
      paragraphs: [
        "You retain ownership of the product information, claims, documents, notes, and other materials you submit to the Service (\"Customer Content\"). You grant ClaimGuard a limited license to host, process, store, display, and use Customer Content solely to provide, maintain, secure, and improve the Service.",
        "You represent and warrant that you have all rights necessary to submit Customer Content and that your use of the Service with that content does not violate law or third-party rights.",
        "You are solely responsible for the accuracy, completeness, substantiation, and legality of all claims and marketing materials you create, approve, or publish, regardless of any output generated by the Service.",
      ],
    },
    {
      heading: "7. Intellectual Property",
      paragraphs: [
        "ClaimGuard and its licensors own the Service, software, branding, documentation, rules libraries, interface design, and all related intellectual property, excluding Customer Content.",
        "Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal business purposes during an active subscription or authorized free tier.",
        "You may not copy, modify, distribute, sell, lease, or create derivative works from the Service except as permitted by law or with our prior written consent.",
      ],
    },
    {
      heading: "8. Third-Party Services",
      paragraphs: [
        "The Service relies on third-party providers such as Supabase for authentication and data storage, Dodo Payments for billing, and hosting/infrastructure vendors. Your use of those services may also be subject to their terms and privacy practices.",
        "The Service may reference or link to official regulatory sources, marketplace policies, or external websites. We do not control and are not responsible for third-party sites, platform enforcement decisions, or changes in third-party rules.",
      ],
    },
    {
      heading: "9. Disclaimers",
      paragraphs: [
        "THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLAIMGUARD DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.",
        "We do not warrant that the Service will be uninterrupted, error-free, complete, current, or free of security vulnerabilities. We do not warrant that risk scores, safer rewrites, regulation alerts, or any other output will identify every compliance issue or prevent enforcement action, account suspension, labeling problems, advertising disputes, or legal liability.",
      ],
    },
    {
      heading: "10. Limitation of Liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLAIMGUARD AND ITS OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AND AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, GOODWILL, DATA, BUSINESS INTERRUPTION, REGULATORY PENALTIES, PLATFORM SUSPENSION, RECALL COSTS, OR REPUTATIONAL HARM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO CLAIMGUARD FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) USD $100.",
        "Some jurisdictions do not allow certain limitations of liability, so some of the above limitations may not apply to you.",
      ],
    },
    {
      heading: "11. Indemnification",
      paragraphs: [
        "You will defend, indemnify, and hold harmless ClaimGuard and its officers, directors, employees, contractors, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your Customer Content; (b) your published or distributed marketing materials; (c) your violation of these Terms; (d) your violation of law or third-party rights; or (e) your reliance on the Service as a substitute for professional review.",
      ],
    },
    {
      heading: "12. Suspension and Termination",
      paragraphs: [
        "We may suspend or terminate your access to the Service immediately if we reasonably believe you violated these Terms, created security risk, misused the Service, failed to pay fees, or if required by law.",
        "You may stop using the Service at any time and cancel paid subscriptions through the billing portal where available. Upon termination, your right to access the Service ends, but sections that by their nature should survive will survive, including ownership provisions, disclaimers, limitations of liability, and indemnification.",
      ],
    },
    {
      heading: "13. Changes to the Service or Terms",
      paragraphs: [
        "We may modify the Service or these Terms from time to time. If we make material changes, we will provide notice through the Service, by email, or by updating the \"Last updated\" date above.",
        "Your continued use of the Service after the effective date of revised Terms constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service.",
      ],
    },
    {
      heading: "14. Governing Law and Disputes",
      paragraphs: [
        "These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law principles, except where mandatory local consumer protection laws provide otherwise.",
        "Before filing a claim, you agree to contact us and attempt to resolve the dispute informally. Except where prohibited by law, any dispute not resolved informally will be brought in the state or federal courts located in Delaware, and you consent to personal jurisdiction in those courts.",
        "Nothing in these Terms limits any rights you may have under mandatory consumer protection laws in your country of residence.",
      ],
    },
    {
      heading: "15. Contact",
      paragraphs: [
        `Questions about these Terms may be sent to ${CONTACT_EMAIL}. For billing issues, include the account email and relevant invoice or subscription details.`,
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: LEGAL_LAST_UPDATED,
  contactEmail: CONTACT_EMAIL,
  intro:
    "This Privacy Policy explains how ClaimGuard (\"ClaimGuard,\" \"we,\" \"us,\" or \"our\") collects, uses, discloses, and protects information when you use our website, applications, and related services (the \"Service\"). By using the Service, you agree to the practices described here.",
  sections: [
    {
      heading: "1. Who This Policy Applies To",
      paragraphs: [
        "This Policy applies to visitors, account holders, trial users, paying customers, and anyone who contacts us about the Service. If you use the Service on behalf of a business, you should ensure your organization has authority to share the information you submit.",
      ],
    },
    {
      heading: "2. Information We Collect",
      paragraphs: [
        "We collect information in the following categories:",
      ],
      bullets: [
        "Account information: name, email address, company name, authentication identifiers, and profile settings.",
        "Workspace data: products, ingredients, markets, sales channels, claims, analysis results, tasks, audit events, onboarding answers, feedback messages, and related compliance workflow records.",
        "Billing information: subscription status, plan tier, customer identifiers, and payment metadata processed by Dodo Payments. We do not store full payment card numbers on our servers.",
        "Technical data: IP address, browser type, device information, pages viewed, timestamps, referral data, and similar usage logs generated by our hosting and security systems.",
        "Communications: messages you send to support, feedback forms, or other correspondence with us.",
      ],
    },
    {
      heading: "3. How We Use Information",
      paragraphs: [
        "We use information to:",
      ],
      bullets: [
        "provide, operate, maintain, and secure the Service;",
        "authenticate users and enforce account permissions;",
        "analyze claims using our rules engine and store results in your workspace;",
        "track plan usage, process subscriptions, and manage billing;",
        "send service-related notices, security alerts, and support responses;",
        "improve features, troubleshoot errors, and prevent abuse;",
        "comply with law, respond to lawful requests, and protect our rights and users.",
      ],
    },
    {
      heading: "4. Claim Analysis and Automated Processing",
      paragraphs: [
        "ClaimGuard's core claim analysis is performed by a deterministic rules engine within our application stack. Unless we clearly disclose a different processing method for a specific feature, we do not send claim text to a third-party generative AI API for standard risk scoring.",
        "Automated outputs may influence internal workflow suggestions, but they do not produce legal decisions about you. You should not treat risk scores or rewrite suggestions as a formal compliance determination.",
      ],
    },
    {
      heading: "5. Legal Bases for Processing (EEA, UK, and Similar Regions)",
      paragraphs: [
        "Where applicable data-protection law requires a legal basis, we rely on:",
      ],
      bullets: [
        "Contract: to provide the Service you request, manage your account, and process subscriptions.",
        "Legitimate interests: to secure the Service, prevent abuse, improve functionality, and support customers, balanced against your rights.",
        "Consent: where required for optional communications or non-essential cookies.",
        "Legal obligation: where we must retain or disclose information to comply with law.",
      ],
    },
    {
      heading: "6. How We Store and Protect Information",
      paragraphs: [
        "Workspace and account data are stored in Supabase-hosted infrastructure using access controls and row-level security designed to restrict user access to the correct workspace records.",
        "We use administrative, technical, and organizational safeguards appropriate to the nature of the Service, including encrypted transport, access-limited service credentials, authenticated APIs, and rate limiting. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
        "You are responsible for safeguarding your login credentials and ensuring that only authorized members of your organization access your workspace.",
      ],
    },
    {
      heading: "7. Data Retention",
      paragraphs: [
        "We retain information for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements.",
        "You may request deletion of your account or workspace data by contacting us. Some information may be retained where required by law, billing records, fraud prevention, or backup systems for a limited period.",
      ],
    },
    {
      heading: "8. When We Share Information",
      paragraphs: [
        "We do not sell your personal information. We may share information with:",
      ],
      bullets: [
        "Service providers that help us operate the Service, such as Supabase, Dodo Payments, hosting providers, email/support tools, and security vendors, under contractual confidentiality and data-protection obligations;",
        "Professional advisers where reasonably necessary for legal, accounting, or compliance purposes;",
        "Law enforcement, regulators, courts, or other parties when required by law or to protect rights, safety, and security;",
        "A successor entity in connection with a merger, acquisition, financing, or sale of assets, subject to this Policy or equivalent protections.",
      ],
    },
    {
      heading: "9. International Data Transfers",
      paragraphs: [
        "ClaimGuard may process and store information in the United States and other countries where we or our service providers operate. If you access the Service from outside the United States, you understand that your information may be transferred to jurisdictions that may have different data-protection laws than your own.",
        "Where required, we implement appropriate safeguards for cross-border transfers.",
      ],
    },
    {
      heading: "10. Your Privacy Rights",
      paragraphs: [
        "Depending on your location, you may have rights to access, correct, delete, restrict, object to, or port certain personal information, and to withdraw consent where processing is consent-based.",
        "You may also have the right to lodge a complaint with your local data-protection authority. To exercise your rights, contact us at the email below. We may need to verify your identity before responding.",
      ],
    },
    {
      heading: "11. Cookies and Similar Technologies",
      paragraphs: [
        "We use cookies and similar technologies necessary for authentication, session management, security, and core site functionality. We may also use analytics or preference technologies where enabled.",
        "For more detail, see our Cookie Policy. You can control cookies through your browser settings. Disabling essential cookies may prevent some parts of the Service from functioning properly.",
      ],
    },
    {
      heading: "12. Children's Privacy",
      paragraphs: [
        "The Service is not directed to children under 18, and we do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will take appropriate steps to delete it.",
      ],
    },
    {
      heading: "13. Sensitive Information",
      paragraphs: [
        "The Service is designed for business compliance workflows, not for collecting consumer health records or large volumes of sensitive personal data. Do not submit personal medical records, government ID numbers, payment card numbers, or other highly sensitive personal data unless your internal policies and applicable law clearly permit it and it is necessary for your use case.",
      ],
    },
    {
      heading: "14. Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. If we make material changes, we will provide notice through the Service, by email, or by updating the \"Last updated\" date above. Your continued use of the Service after the effective date constitutes acceptance of the revised Policy.",
      ],
    },
    {
      heading: "15. Contact",
      paragraphs: [
        `Privacy questions and data requests may be sent to ${CONTACT_EMAIL}. Please include the account email associated with your workspace so we can respond efficiently.`,
      ],
    },
  ],
};

export const PRODUCT_DISCLAIMER: LegalDocument = {
  title: "Disclaimer",
  lastUpdated: LEGAL_LAST_UPDATED,
  contactEmail: CONTACT_EMAIL,
  intro:
    "This Disclaimer explains important limitations of ClaimGuard. Please read it carefully before using analysis results, safer rewrites, regulation alerts, SOP drafts, or any other output from the Service.",
  sections: [
    {
      heading: "1. No Legal, Medical, or Regulatory Advice",
      paragraphs: [
        "ClaimGuard provides rules-engine risk flags, educational guidance, workflow tools, and reference materials to support internal review. Nothing in the Service constitutes legal advice, regulatory advice, medical advice, labeling approval, advertising clearance, or a guarantee that any claim is compliant.",
        "ClaimGuard is not a law firm, compliance consultancy, certification body, or government agency. No attorney-client, consultant-client, or regulator-regulated relationship is created by your use of the Service.",
      ],
    },
    {
      heading: "2. You Are Responsible for What You Publish",
      paragraphs: [
        "You remain solely responsible for every claim, label statement, advertisement, Amazon listing, website page, social caption, influencer brief, package panel, and sales communication you publish or distribute.",
        "A low-risk score, green status, safer rewrite, approved task state, or absence of a warning does not mean a claim is lawful, substantiated, fairly presented, or appropriate for your product, audience, market, or sales channel.",
      ],
    },
    {
      heading: "3. Rules-Engine Limitations",
      paragraphs: [
        "ClaimGuard uses phrase-based and rules-based detection. This approach has inherent limits. The Service may:",
      ],
      bullets: [
        "miss risky claims that do not match current phrase patterns;",
        "flag benign language because of wording similarity;",
        "fail to detect missing substantiation, improper implied claims, or misleading context;",
        "fail to account for product-specific formulation, intended use, dosing, audience, or channel nuances;",
        "fail to identify jurisdiction-specific requirements not represented in the current rule set;",
        "provide safer rewrites that are still too strong, too weak, or inappropriate for your brand voice or legal position.",
      ],
    },
    {
      heading: "4. Regulatory Coverage Limitations",
      paragraphs: [
        "Regulation summaries, impact alerts, and source links are provided for awareness and workflow support. Regulatory requirements change frequently and may differ by product category, ingredient, claim type, audience, distribution channel, and jurisdiction.",
        "ClaimGuard does not monitor every rule that may apply to your business. Official agency guidance, marketplace policies, state or provincial laws, industry codes, and private platform enforcement standards may impose additional requirements not reflected in the Service.",
      ],
    },
    {
      heading: "5. Marketplace and Platform Enforcement",
      paragraphs: [
        "Amazon, Meta, Google, Shopify, marketplaces, ad platforms, retailers, and other third parties may enforce their own policies independently of any ClaimGuard output. A claim that appears acceptable in the Service may still be rejected, suppressed, delisted, or penalized by a third-party platform.",
        "ClaimGuard is not responsible for account suspensions, listing removals, ad disapprovals, payment holds, or other platform enforcement actions.",
      ],
    },
    {
      heading: "6. Substantiation and Scientific Claims",
      paragraphs: [
        "Compliance is not only about wording. Many claims require competent and reliable scientific evidence, clinical support, testing, regulatory status, ingredient legality, structure/function qualification, disclaimer placement, and other substantiation that the Service does not verify.",
        "ClaimGuard does not review your studies, lab reports, certificates, formulas, manufacturing records, or supporting documentation unless you separately provide that review through qualified professionals.",
      ],
    },
    {
      heading: "7. No Guarantee of Outcomes",
      paragraphs: [
        "We do not guarantee that use of ClaimGuard will prevent FDA warning letters, FTC enforcement, state attorney general actions, competitor challenges, customer complaints, civil litigation, import detentions, labeling citations, or any other regulatory or commercial consequence.",
        "Any examples, benchmarks, safer rewrites, or educational content are illustrative only and may not reflect the best legal strategy for your specific situation.",
      ],
    },
    {
      heading: "8. Human and Professional Review Required",
      paragraphs: [
        "The Service is designed to support human review, not replace it. Before publishing any medium- or high-risk claim, health-related statement, weight-management claim, disease-related language, performance claim, testimonial, influencer script, or marketplace listing, obtain review from qualified compliance and legal professionals familiar with your product and markets.",
      ],
    },
    {
      heading: "9. Contact",
      paragraphs: [
        `Questions about this Disclaimer may be sent to ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  title: "Cookie Policy",
  lastUpdated: LEGAL_LAST_UPDATED,
  contactEmail: CONTACT_EMAIL,
  intro:
    "This Cookie Policy explains how ClaimGuard uses cookies and similar technologies when you visit our website or use our applications. It should be read together with our Privacy Policy.",
  sections: [
    {
      heading: "1. What Are Cookies?",
      paragraphs: [
        "Cookies are small text files stored on your browser or device when you visit a website. Similar technologies, such as local storage and session storage, may also be used to remember preferences or keep you signed in.",
      ],
    },
    {
      heading: "2. How ClaimGuard Uses Cookies",
      paragraphs: [
        "We use cookies and similar technologies for the following purposes:",
      ],
      bullets: [
        "Essential operation: to keep you logged in, protect your account, and enable core workspace features;",
        "Security: to help detect abuse, enforce rate limits, and maintain session integrity;",
        "Preferences: to remember settings such as theme or display choices where available;",
        "Performance and diagnostics: to understand how the Service is used and to fix errors, where enabled.",
      ],
    },
    {
      heading: "3. Cookies We Use",
      paragraphs: [
        "The exact names and durations of cookies may change as we improve the Service, but they generally fall into these categories:",
      ],
      bullets: [
        "Authentication/session cookies from Supabase and our application stack, required for login and account access;",
        "Security and routing cookies from our hosting provider, used to deliver the site safely and reliably;",
        "Preference cookies that store non-sensitive UI choices in your browser;",
        "Analytics or diagnostic cookies only where we enable them to measure product performance.",
      ],
    },
    {
      heading: "4. Third-Party Cookies",
      paragraphs: [
        "Some cookies may be set by service providers that help us operate ClaimGuard, such as hosting, authentication, payment, or analytics vendors. Those providers may process technical information according to their own privacy policies.",
        "We do not use advertising cookies to sell your personal information.",
      ],
    },
    {
      heading: "5. Your Choices",
      paragraphs: [
        "You can control or delete cookies through your browser settings. Most browsers let you block cookies entirely, block third-party cookies, or clear stored cookies when you close the browser.",
        "If you disable essential cookies, parts of ClaimGuard may not function correctly, including login and workspace access.",
      ],
    },
    {
      heading: "6. Updates to This Policy",
      paragraphs: [
        "We may update this Cookie Policy from time to time. When we do, we will revise the \"Last updated\" date above. Material changes may also be described in our Privacy Policy or through in-product notice.",
      ],
    },
    {
      heading: "7. Contact",
      paragraphs: [
        `Questions about cookies or this Policy may be sent to ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};