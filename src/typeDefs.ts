export const typeDefs = `#graphql
	type Query {
		retrieveArticle(uuid: String!): Article
		listArticles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type Article {
		uuid: String!
		url: String!
		title: String
		description: String
		date: String
		lang: String
		image: String
		text: String
	}

	type ArticleList {
		total: Int!
		items: [Article!]!
	}
`
