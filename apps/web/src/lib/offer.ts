import { PAYMENTS } from "../config/site";
import { companyComplete } from "../config/company.js";
import { OFFER } from "../config/offer.js";

/** Selling is on: PAYMENTS and the business details (the API keys are checked by the functions themselves). */
export const selling = () => PAYMENTS && companyComplete();

/** A theme that needs access (only while selling). */
export const needsAccess = (n: number) => selling() && n > OFFER.freeThemes;

/** The price as readers write it: "7,99" in Dutch, "7.99" in English. */
export const priceText = (locale: string) => Number(OFFER.price).toLocaleString(locale === "en" ? "en-GB" : "nl-NL", { minimumFractionDigits: 2 });
