import {Logger} from 'pino';

export type GoogleImageSearchResult = {
  url: string;
  title?: string;
  snippet?: string;
  displayLink?: string;
  contextLink?: string;
  mime?: string;
  width?: number;
  height?: number;
};

/**
 * Service to interact with Google Custom Search API for image search.
 */
class GoogleImageServiceImpl {
  private apiKey: string | undefined;
  private cx: string | undefined;
  private baseURL: string;

  constructor(apiKey?: string, cx?: string) {
    this.apiKey = apiKey;
    this.cx = cx;
    this.baseURL = 'https://www.googleapis.com/customsearch/v1';
  }

  /**
   * Searches for images on Google using the Custom Search API.
   * @param query The search query.
   * @param logger Logger instance.
   * @param start The index of the first result to return (for pagination).
   * @returns A promise that resolves to an array of image results or an Error.
   */
  searchImages = async (
      query: string,
      logger: Logger,
      start: number = 1,
      num: number = 10,
  ): Promise<GoogleImageSearchResult[] | Error> => {
    if (!this.apiKey || !this.cx) {
      logger.warn('GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID is not set, skipping image search.');
      return [];
    }

    const searchUrl = new URL(this.baseURL);
    searchUrl.searchParams.append('key', this.apiKey);
    searchUrl.searchParams.append('cx', this.cx);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('searchType', 'image');
    searchUrl.searchParams.append('num', Math.min(Math.max(num, 1), 10).toString());
    searchUrl.searchParams.append('start', start.toString());
    searchUrl.searchParams.append('safe', 'active');

    logger.debug({url: searchUrl.toString(), query, start, num}, 'Making Google Custom Search API request');

    try {
      const response = await fetch(searchUrl.toString());

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({status: response.status, errorText}, 'Google Custom Search API request failed');
        return new Error(`Google Custom Search API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imageResults: GoogleImageSearchResult[] = [];

      if (
        typeof data === 'object' &&
          data !== null &&
          'items' in data &&
          Array.isArray(data.items)
      ) {
        for (const item of data.items) {
          if (!item?.link || typeof item.link !== 'string') continue;

          imageResults.push({
            url: item.link,
            title: typeof item.title === 'string' ? item.title : undefined,
            snippet: typeof item.snippet === 'string' ? item.snippet : undefined,
            displayLink: typeof item.displayLink === 'string' ? item.displayLink : undefined,
            contextLink:
              typeof item.image?.contextLink === 'string'
                ? item.image.contextLink
                : undefined,
            mime: typeof item.mime === 'string' ? item.mime : undefined,
            width: typeof item.image?.width === 'number' ? item.image.width : undefined,
            height: typeof item.image?.height === 'number' ? item.image.height : undefined,
          });
        }
      }

      logger.info({query, resultsCount: imageResults.length}, 'Google Custom Search API request successful');
      return imageResults;
    } catch (err) {
      logger.error({err, query}, 'Error during Google Custom Search API call');
      return err instanceof Error ? err : new Error(String(err));
    }
  };
}

let instance: GoogleImageServiceImpl;

const getInstance = (): GoogleImageServiceImpl => {
  if (!instance) {
    instance = new GoogleImageServiceImpl(
        process.env.GOOGLE_SEARCH_API_KEY,
        process.env.GOOGLE_SEARCH_ENGINE_ID,
    );
  }
  return instance;
};

export {getInstance};
