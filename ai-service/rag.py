from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

EMBED_MODEL = "models/gemini-embedding-001"   # <- use the name from step 2
CHROMA_DIR = "./chroma_db"

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(model=EMBED_MODEL)
    return _embeddings


def get_store(collection: str) -> Chroma:
    return Chroma(
        collection_name=collection,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DIR,
    )


def retrieve(collection: str, query: str, k: int = 4):
    return get_store(collection).similarity_search(query, k=k)