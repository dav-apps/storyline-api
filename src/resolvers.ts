import * as articleResolvers from "./resolvers/article.js"

export const resolvers = {
	Query: {
		listArticles: articleResolvers.listArticles
	}
}
