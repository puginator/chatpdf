import {Pinecone} from "@pinecone-database/pinecone";
import {convertToAscii} from "./utils";
import {getEmbeddings} from "./embeddings";

// export async function getMatchesFromEmbeddings(
//   embeddings: number[],
//   fileKey: string
// ) {
//   try {
//     const client = new Pinecone({
//       environment: process.env.PINECONE_ENVIRONMENT!,
//       apiKey: process.env.PINECONE_API_KEY!,
//     });
//     const pineconeIndex = await client.index("chatpdf");
//     const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
//     const queryResult = await namespace.query({
//       topK: 5,
//       vector: embeddings,
//       includeMetadata: true,
//     });
//     return queryResult.matches || [];
//   } catch (error) {
//     console.log("error querying embeddings", error);
//     throw error;
//   }
// }
export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  try {
    const client = new Pinecone({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = await client.index("chatpdf");

    // Query directly against the Pinecone index, no namespace
    const queryResult = await pineconeIndex.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });

    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}


export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);
  console.log("matches", matches);
  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.7
  );
  
  if (qualifyingDocs.length === 0) {
    return "We don't have enough information to answer that question";
  }
  type Metadata = {
    text: string;
    pageNumber: number;
  };

  let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
  // 5 vectors
  return docs.join("\n").substring(0, 3000);
}
