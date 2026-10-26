import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
from rag import get_store

COLLECTIONS = {
    "crops": "data/crops",
    "schemes": "data/schemes",
}

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16")
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw.decode("cp1252", errors="ignore")


def load_files(folder: str):
    docs = []
    path = Path(folder)
    if not path.exists():
        print(f"Folder not found: {folder}")
        return docs
    for f in sorted(path.iterdir()):
        suffix = f.suffix.lower()
        if suffix == ".txt":
            pages = [Document(page_content=read_text(f))]
        elif suffix == ".pdf":
            pages = PyPDFLoader(str(f)).load()
        else:
            continue
        chars = sum(len(p.page_content.strip()) for p in pages)
        if chars < 200:
            print(f"SKIPPED {f.name}: only {chars} characters of text")
            continue
        for p in pages:
            p.metadata["source_file"] = f.name
        docs.extend(pages)
        print(f"Loaded {f.name}: {chars} characters")
    return docs


def ingest(collection: str):
    print(f"\n--- {collection} ---")
    docs = load_files(COLLECTIONS[collection])
    if not docs:
        print("Nothing to ingest.")
        return

    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks")

    store = get_store(collection)
    store.delete_collection()          # start fresh so reruns don't duplicate
    store = get_store(collection)

    BATCH = 50
    for i in range(0, len(chunks), BATCH):
        store.add_documents(chunks[i:i + BATCH])
        print(f"  embedded {min(i + BATCH, len(chunks))}/{len(chunks)}")
        time.sleep(1)

    print(f"Done: '{collection}' ready.")


if __name__ == "__main__":
    names = sys.argv[1:] or list(COLLECTIONS)
    for name in names:
        ingest(name)