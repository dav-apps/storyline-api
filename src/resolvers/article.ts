import { Publisher, Article } from "@prisma/client"
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
