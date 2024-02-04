import { Express, Request, Response } from "express"
import cors from "cors"
import { handleEndpointError } from "../utils.js"

export async function fetchArticles(req: Request, res: Response) {
	try {
		res.status(200).json()
	} catch (error) {
		handleEndpointError(res, error)
	}
}

export function setup(app: Express) {
	app.post("/articles/fetch", cors(), fetchArticles)
}
