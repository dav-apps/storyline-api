import { Publisher } from "@prisma/client"
import { ResolverContext } from "../types.js"

export async function retrievePublisher(
	parent: any,
	args: { uuid: string },
	context: ResolverContext
): Promise<Publisher> {
	return await context.prisma.publisher.findFirst({
		where: { uuid: args.uuid }
	})
}
