/**
 * What a buyer gets, in one place for the site (pages, study-data) and the server functions (api/checkout.js,
 * api/redeem.js): one payment for every theme after the free ones, for a fixed number of days.
 * Plain JavaScript, so the functions in /api can import it without a build step.
 */
export const OFFER = {
  /** The price in euros, VAT included, as Mollie wants it: a string with two decimals. */
  price: "7.99",
  currency: "EUR",
  /** Dutch VAT on an electronic service. */
  vatRate: 21,
  /** Days of access from the moment of payment. */
  days: 365,
  /** Themes 1 … freeThemes stay free (with the whole knowledge base); the rest needs access. */
  freeThemes: 1,
};
