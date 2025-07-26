import { type SchemaTypeDefinition } from 'sanity'
import imageVoting from './imageVoting'
import category from './category'
import votingSession from './votingSession'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [imageVoting, category, votingSession],
}
