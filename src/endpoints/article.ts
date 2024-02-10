import { Express, Request, Response } from "express"
import cors from "cors"
import Parser from "rss-parser"
import urlMetadata from "url-metadata"
import { handleEndpointError } from "../utils.js"
import { prisma, apify } from "../../server.js"

async function fetchArticles2(req: Request, res: Response) {
	try {
		const parser = new Parser({ customFields: { feed: ["copyright"] } })
		const feeds = await prisma.feed.findMany()

		for (let f of feeds) {
			const feed = await parser.parseURL(f.url)

			for (let feedItem of feed.items) {
				if (feedItem.guid == null) continue

				// Try to find the article in the database
				const article = await prisma.article.findFirst({
					where: { uuid: feedItem.guid },
					include: { feeds: true }
				})

				if (article == null) {
					// Get the metadata, to get the image url
					const metadata = await urlMetadata(feedItem.link)

					await prisma.article.create({
						data: {
							uuid: feedItem.guid,
							feeds: { connect: { id: f.id } },
							url: feedItem.link,
							title: feedItem.title,
							description: feedItem.contentSnippet,
							date: new Date(feedItem.pubDate),
							imageUrl: metadata["og:image"],
							content: feedItem.content
						}
					})
				} else {
					// Check if the article already belongs to the feed
					let i = article.feeds.findIndex(item => item.id == f.id)

					if (i == -1) {
						// Add the article to the current feed
						await prisma.article.update({
							where: { id: article.id },
							data: { feeds: { connect: { id: f.id } } }
						})
					}
				}
			}
		}

		res.status(200).json()
	} catch (error) {
		handleEndpointError(res, error)
	}
}

async function fetchArticles(req: Request, res: Response) {
	try {
		// Get all publishers
		const publishers = await prisma.publisher.findMany()
		const startUrls: { url: string }[] = []

		for (let publisher of publishers) {
			startUrls.push({ url: `https://${publisher.url}` })
		}

		const input = {
			startUrls,
			onlyNewArticles: true,
			onlyNewArticlesPerDomain: true,
			onlyInsideArticles: true,
			enqueueFromArticles: false,
			crawlWholeSubdomain: false,
			onlySubdomainArticles: false,
			scanSitemaps: false,
			saveSnapshots: false,
			useGoogleBotHeaders: false,
			minWords: 150,
			mustHaveDate: true,
			isUrlArticleDefinition: {
				minDashes: 4,
				hasDate: true,
				linkIncludes: [
					"article",
					"storyid",
					"?p=",
					"id=",
					"/fpss/track",
					".html",
					"/content/"
				]
			},
			proxyConfiguration: {
				useApifyProxy: true
			},
			useBrowser: false
		}

		const run = await apify.actor(process.env.APIFY_ACTOR_ID).call(input)
		const { items } = await apify.dataset(run.defaultDatasetId).listItems()

		for (let item of items) {
			const loadedDomain = item.loadedDomain as string
			const loadedUrl = item.loadedUrl as string

			// Find the publisher
			const publisher = await prisma.publisher.findFirst({
				where: { url: loadedDomain }
			})

			if (publisher == null) {
				console.error("Publisher does not exist! " + loadedDomain)
				continue
			}

			// Check if the article is already in the database
			let article = await prisma.article.findFirst({
				where: { url: loadedUrl }
			})

			if (article != null) {
				console.error("Article already exists! " + article.url)
				continue
			}

			/*
			await prisma.article.create({
				data: {
					publisherId: publisher.id,
					url: loadedUrl,
					title: item.title as string,
					description: item.description as string,
					date: item.date as string,
					lang: item.lang as string,
					image: item.image as string,
					text: item.text as string
				}
			})
			*/
		}

		res.status(200).json()
	} catch (error) {
		handleEndpointError(res, error)
	}
}

export function setup(app: Express) {
	app.post("/articles/fetch", cors(), fetchArticles2)
}
