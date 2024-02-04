export const typeDefs = `#graphql
	type Query {
		listArticles: ArticleList!
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
