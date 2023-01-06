import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

const redis = new Redis({
  port: 6379,
  host: "127.0.0.1",
});

const searchEndpoint = (searchTerm) =>
  `https://newsapi.org/v2/everything?q=${searchTerm}&from=2023-01-06&sortBy=popularity&apiKey=${process.env.NEWS_API_KEY}`;

const getNews = async (searchTerm) => {
  // Check if we have a cached value
  let cacheEntry = await redis.get(`news:${searchTerm}`);

  // If we have a cache hit
  if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // Return that entry
    return { ...cacheEntry, source: "CACHE" };
  }

  // Cache miss
  // Otherwise call API
  let apiResponse = await axios.get(searchEndpoint(searchTerm));
  redis.set(`news:${searchTerm}`, JSON.stringify(apiResponse.data), "EX", 3600);
  return { ...apiResponse.data, source: "API" };
};

const searchTerm = "Manchester United";
const t0 = new Date().getTime();
let news = await getNews(searchTerm);
const t1 = new Date().getTime();
news.responseTime = `${t1 - t0}ms`;
console.log(news);
process.exit();
