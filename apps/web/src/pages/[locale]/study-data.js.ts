import type { APIRoute } from "astro";
import { localePaths } from "../../i18n";
import { studyData } from "../../lib/study-data";

/** The head script's data for one language (lib/study-data.ts). */
export const getStaticPaths = localePaths;
export const GET: APIRoute = ({ params }) => new Response(studyData(params.locale as string).body, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
