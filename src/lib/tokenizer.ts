import GPT3TokenizerImport from 'gpt3-tokenizer'

//If it is a function its GPT3Tokenizer import otherwise it is of type any default
const GPT3Tokenizer: typeof GPT3TokenizerImport =
	typeof GPT3TokenizerImport === 'function'
		? GPT3TokenizerImport
		: (GPT3TokenizerImport as any).default

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

//Take a string input and returns the total number of tokens a string contains.
export function getTokens(input: string): number {
	const tokens = tokenizer.encode(input)
	return tokens.text.length
}
