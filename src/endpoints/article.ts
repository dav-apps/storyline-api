import { Express, Request, Response } from "express"
import cors from "cors"
import { handleEndpointError } from "../utils.js"
import { prisma, apify } from "../../server.js"

export async function fetchArticles(req: Request, res: Response) {
	try {
		const input = {
			startUrls: [
				{
					url: "https://www.tagesschau.de/"
				}
			],
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

		const run = await apify.actor(process.env.APIFY_ACTORY_ID).call(input)
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
		}

		res.status(200).json()
	} catch (error) {
		handleEndpointError(res, error)
	}
}

export function setup(app: Express) {
	app.post("/articles/fetch", cors(), fetchArticles)
}
