import { Publisher, Article } from "@prisma/client"
import { Readability, isProbablyReaderable } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import axios from "axios"
import { ResolverContext, List } from "../types.js"

export async function retrieveArticle(
	parent: any,
	args: { uuid: string },
	context: ResolverContext
): Promise<Article> {
	return await context.prisma.article.findFirst({
		where: { uuid: args.uuid }
	})
}

export async function listArticles(
	parent: any,
	args: {
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<List<Article>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	const [total, items] = await context.prisma.$transaction([
		context.prisma.article.count(),
		context.prisma.article.findMany({
			take,
			skip,
			orderBy: { date: "desc" }
		})
	])

	return {
		total,
		items
	}
}

export async function publisher(
	article: Article,
	args: any,
	context: ResolverContext
): Promise<Publisher> {
	const articleWithFeeds = await context.prisma.article.findFirst({
		where: { id: article.id },
		include: { feeds: true }
	})

	const feed = await context.prisma.feed.findFirst({
		where: { id: articleWithFeeds.feeds[0].id }
	})

	return await context.prisma.publisher.findFirst({
		where: { id: feed.publisherId }
	})
}

export async function content(article: Article): Promise<string> {
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

		return new Readability(document).parse().content
	} else {
		return article.content
	}
}
