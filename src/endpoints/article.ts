import { Express, Request, Response } from "express"
import cors from "cors"
import Parser from "rss-parser"
import urlMetadata from "url-metadata"
import { handleEndpointError } from "../utils.js"
import { prisma } from "../../server.js"

async function fetchArticles(req: Request, res: Response) {
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

export function setup(app: Express) {
	app.post("/articles/fetch", cors(), fetchArticles)
}
