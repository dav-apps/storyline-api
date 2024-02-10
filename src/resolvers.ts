import * as articleResolvers from "./resolvers/article.js"

export const resolvers = {
	Query: {
		retrieveArticle: articleResolvers.retrieveArticle,
		listArticles: articleResolvers.listArticles
	},
	Article: {
		publisher: articleResolvers.publisher,
		content: articleResolvers.content
	}
}
