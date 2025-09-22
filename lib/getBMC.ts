import fetch from "node-fetch";
import * as cheerio from "cheerio";


interface MeetingData {
  name: string;
  location: string;
  type: string;
  date: string;
  url: string;
}

function isNumber(value?: string | number): boolean
{
   return ((value != null) &&
           (value !== '') &&
           !isNaN(Number(value.toString())));
}

export async function scrapeBMCEvent(url: string): Promise<MeetingData> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const urlSplit = url.split("-");
  if (urlSplit.length < 3) {
    throw new Error(`Unexpected URL format: ${url}`);
  }
  if (!isNumber(urlSplit[urlSplit.length - 1].slice(0, -1)) || !isNumber(urlSplit[urlSplit.length - 3])) {
    throw new Error(`Unexpected URL format: ${url}`);
  }
  const dateStr = `${urlSplit[urlSplit.length - 3]} ${urlSplit[urlSplit.length - 2].slice(0, 3)} ${urlSplit[urlSplit.length - 1].slice(0, -1)}`;
  const date = new Date(dateStr).toISOString().split("T")[0];

  const locationSplit = urlSplit.slice(0, -3);
  let title = locationSplit[0].split("/").pop() || "";
  for (const part of locationSplit.slice(1)) {
    title += ` ${part}`;
  }
  title = title.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Description
  const paragraphs = $("p").map((_, el) => $(el).text()).get();

  // Quick links
  const quickLinksHeader = $("h2").filter((_, el) => $(el).text().includes("QUICK LINKS")).first();
  let venueLink: string | undefined = undefined;

  if (quickLinksHeader.length) {
    const headerContainer = quickLinksHeader.parent()?.parent();
    const linksContainer = headerContainer?.next();
    venueLink = linksContainer?.find("a").filter((_, a) => $(a).text().toLowerCase() === "venue").attr("href");
  }

  // Venue
  let venue = "";
  if (venueLink) {
    const response2 = await fetch(venueLink);
    const html2 = await response2.text();
    const $2 = cheerio.load(html2);
    const title2 = $2("title").text();
    venue = title2.split(" - ")[0];
  }

  return {
    name: title,
    location: venue,
    type: "Track & Field",
    date: date,
    url: url,
  };
}

export async function getBMCFixtures(): Promise<string[]> {
    const url = "https://www.britishmilersclub.com/fixtures/";
    const response = await fetch(url);
    const html = await response.text();
  
    const currentYear = new Date().getFullYear().toString();
    const nextYear = (new Date().getFullYear() + 1).toString();
  
    const $ = cheerio.load(html);
    const links: string[] = [];
  
    $("a").each((_, el) => {
      const linkUrl = $(el).attr("href") ?? "";
      const text = $(el).text().trim();

      const fullUrl = linkUrl.startsWith("http") 
        ? linkUrl 
        : `https://www.britishmilersclub.com${linkUrl}`;
  
      if (fullUrl.includes("meeting") && (text.includes(currentYear) || text.includes(nextYear))) {
        links.push(fullUrl);
      }
    });
  
    return links;
  }