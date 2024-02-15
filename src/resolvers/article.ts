import { Publisher, Article } from "@prisma/client"
import { Readability, isProbablyReaderable } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import axios from "axios"
import { ResolverContext, QueryResult, List } from "../types.js"

export async function retrieveArticle(
	parent: any,
	args: { uuid: string },
	context: ResolverContext
): Promise<QueryResult<Article>> {
	return {
		caching: true,
		data: await context.prisma.article.findFirst({
			where: { uuid: args.uuid }
		})
	}
}

export async function listArticles(
	parent: any,
	args: {
		publishers?: string[]
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<QueryResult<List<Article>>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	let publisherIds: bigint[] = []

	if (args.publishers != null) {
		for (let uuid of args.publishers) {
			let publisher = await context.prisma.publisher.findFirst({
				where: { uuid }
			})

			if (publisher != null) {
				publisherIds.push(publisher.id)
			}
		}
	}

	let where: any = {}

	if (publisherIds.length > 0) {
		where = {
			feeds: { some: { publisher: { id: { in: publisherIds } } } }
		}
	}

	const [total, items] = await context.prisma.$transaction([
		context.prisma.article.count({ where }),
		context.prisma.article.findMany({
			where,
			take,
			skip,
			orderBy: { date: "desc" }
		})
	])

	return {
		caching: true,
		data: {
			total,
			items
		}
	}
}

export async function publisher(
	article: Article,
	args: any,
	context: ResolverContext
): Promise<QueryResult<Publisher>> {
	const articleWithFeeds = await context.prisma.article.findFirst({
		where: { id: article.id },
		include: { feeds: true }
	})

	const feed = await context.prisma.feed.findFirst({
		where: { id: articleWithFeeds.feeds[0].id }
	})

	return {
		caching: true,
		data: await context.prisma.publisher.findFirst({
			where: { id: feed.publisherId }
		})
	}
}

export async function content(article: Article): Promise<QueryResult<string>> {
	let res = await axios({
		method: "get",
		url: article.url
	})

	const dom = new JSDOM(res.data)
	const document = dom.window.document

	if (isProbablyReaderable(document)) {
		let aTags = document.querySelectorAll("a")

		aTags.forEach((item: HTMLAnchorElement) => {
			item.setAttribute("target", "blank")
		})

		return {
			caching: true,
			data: new Readability(document).parse().content
		}
	} else {
		return {
			caching: true,
			data: article.content
		}
	}
}
