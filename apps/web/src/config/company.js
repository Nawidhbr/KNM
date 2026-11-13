/**
 * The business behind the site. Dutch law (art. 3:15d BW) and Mollie require these on the site before anything is
 * sold: they appear on the terms page (/<locale>/terms/) and in the confirmation mail (api/mollie-webhook.js).
 * Plain JavaScript, so the functions in /api can import it. Selling stays off until every field is filled in.
 */
export const COMPANY = {
  /** The trade name as registered at the KvK. */
  name: "AQLI",
  /** Street, number, postcode and town of the business address. */
  address: "",
  /** The KvK number (8 digits). */
  kvk: "",
  /** The VAT identification number (btw-id, NL…B..). */
  vat: "",
};

export const companyComplete = () => Boolean(COMPANY.name && COMPANY.address && COMPANY.kvk && COMPANY.vat);
