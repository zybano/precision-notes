
/**
 * Creates JSON-LD schema markup for various entities 
 */

export const createOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PrecisionNote",
    "url": window.location.origin,
    "logo": `${window.location.origin}/og-image.png`,
    "sameAs": [
      "https://twitter.com/precisionnote",
      "https://www.linkedin.com/company/precisionnote",
      "https://github.com/precisionnote"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-800-123-4567",
      "contactType": "customer service",
      "availableLanguage": "English"
    }
  };
};

export const createProductSchema = (name: string, description: string, image: string, price: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "image": `${window.location.origin}${image}`,
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "USD"
    },
    "applicationCategory": "HealthcareApplication",
    "operatingSystem": "Web"
  };
};
