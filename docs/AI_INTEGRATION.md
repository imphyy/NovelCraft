# NovelCraft AI Integration Guide

## Overview

NovelCraft uses **RAG (Retrieval-Augmented Generation)** to provide AI assistance without sending the entire manuscript to the API. This guide explains the implementation, cost optimization, and safety measures.

---

## Why RAG?

### Problems with Sending Full Manuscript:

1. **Cost:** GPT-5 costs ~$10/1M output tokens. A 100K word novel is ~130K tokens.
2. **Context Limits:** Models have token limits (GPT-4o: 128K, GPT-5: variable)
3. **Inefficiency:** Most content is irrelevant to any given query
4. **Privacy:** Sending full text to API exposes entire work

### RAG Solution:

1. **Chunk** text into small pieces (~500-1,200 tokens)
2. **Embed** each chunk (convert to vector)
3. **Store** embeddings in database (pgvector)
4. **Retrieve** only relevant chunks when AI needed
5. **Send** retrieved chunks + prompt to model
6. **Cite** sources in response

---

## Architecture

```
User Query
    ↓
Generate Query Embedding
    ↓
Search Chunks (Vector Similarity)
    ↓
Retrieve Top K Chunks (K = 5-10)
    ↓
Construct Prompt (Lore Bible + Chunks + Query)
    ↓
Send to OpenAI API
    ↓
Parse Response + Extract Citations
    ↓
Return to User
```

---

## Step 1: Chunking

### When to Chunk:

- When chapter/wiki page is created
- When chapter/wiki page is updated
- Trigger: Save event → background job

### Chunking Strategy:

**Target size:** 500-1,200 tokens per chunk

**Split by:**
- Paragraphs (preferred)
- Sentences (if paragraph too large)
- Hard limit at 1,200 tokens

**Overlap:**
- Optional: 50-100 token overlap between chunks
- Helps preserve context across boundaries

### Implementation (Pseudo-Go):

```go
func ChunkText(text string, maxTokens int) []Chunk {
    paragraphs := strings.Split(text, "\n\n")
    chunks := []Chunk{}
    currentChunk := ""
    currentTokens := 0

    for _, para := range paragraphs {
        paraTokens := EstimateTokens(para)

        if currentTokens + paraTokens > maxTokens {
            // Save current chunk
            chunks = append(chunks, Chunk{Text: currentChunk})
            currentChunk = para
            currentTokens = paraTokens
        } else {
            currentChunk += "\n\n" + para
            currentTokens += paraTokens
        }
    }

    if currentChunk != "" {
        chunks = append(chunks, Chunk{Text: currentChunk})
    }

    return chunks
}
```

### Token Estimation:

Use `tiktoken` (Python) or `tiktoken-go` (Go) for accurate counts.

**Rough estimate:** 1 token ≈ 0.75 words (English)

---

## Step 2: Embeddings

### Model: `text-embedding-3-small`

**Specs:**
- Dimensions: 1536
- Cost: ~$0.02/1M tokens
- Speed: Fast (~100ms per request)

**Alternative:** `text-embedding-3-large` (3072 dims, slightly better quality, 2x cost)

### Generate Embeddings:

**OpenAI API Call:**
```go
import "github.com/sashabaranov/go-openai"

func GenerateEmbedding(text string) ([]float32, error) {
    client := openai.NewClient(apiKey)
    resp, err := client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
        Model: openai.AdaEmbeddingV3Small,
        Input: []string{text},
    })
    if err != nil {
        return nil, err
    }
    return resp.Data[0].Embedding, nil
}
```

### Batch Processing:

- Embed multiple chunks in single API call (up to ~100 chunks)
- Reduces overhead, faster processing

---

## Step 3: Storage (pgvector)

### Table: `chunks`

```sql
CREATE TABLE chunks (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT,
    text TEXT,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Insert Chunks:

```go
func InsertChunk(db *pgxpool.Pool, chunk Chunk, embedding []float32) error {
    _, err := db.Exec(ctx, `
        INSERT INTO chunks (id, document_id, chunk_index, text, embedding, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, chunk.ID, chunk.DocumentID, chunk.Index, chunk.Text, pgvector.NewVector(embedding), chunk.Metadata)
    return err
}
```

---

## Step 4: Retrieval

### Query: Find Similar Chunks

```sql
SELECT
    c.id,
    c.text,
    c.metadata,
    1 - (c.embedding <=> $1) AS similarity
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE d.project_id = $2
ORDER BY c.embedding <=> $1
LIMIT $3;
```

**Explanation:**
- `<=>` is cosine distance operator (pgvector)
- `1 - distance` = similarity score (0 to 1)
- Filter by project_id (ownership check)
- Limit to top K results (e.g., K=10)

### Implementation:

```go
func RetrieveChunks(db *pgxpool.Pool, queryEmbedding []float32, projectID string, limit int) ([]Chunk, error) {
    rows, err := db.Query(ctx, `
        SELECT c.id, c.text, c.metadata, 1 - (c.embedding <=> $1) AS similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.project_id = $2
        ORDER BY c.embedding <=> $1
        LIMIT $3
    `, pgvector.NewVector(queryEmbedding), projectID, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    chunks := []Chunk{}
    for rows.Next() {
        var chunk Chunk
        rows.Scan(&chunk.ID, &chunk.Text, &chunk.Metadata, &chunk.Similarity)
        chunks = append(chunks, chunk)
    }
    return chunks, nil
}
```

---

## Step 5: Prompt Construction

### Template:

```
System: You are an AI writing assistant for NovelCraft.

You are helping the user write a novel. You must:
- Preserve canon consistency
- Never invent lore facts unless instructed
- Maintain mystery and ambiguity
- Cite sources for all factual claims

Canon-Safe Mode: [ON/OFF]

Retrieved Context:
---
[Chunk 1 - Chapter 3, paragraph 2]
"Text of chunk..."

[Chunk 2 - Wiki: Character "Rhea"]
"Text of chunk..."
---

User Question:
"Where did we first mention the crystal?"

Instructions:
Answer the question using ONLY the retrieved context. Cite sources.
```

### Implementation:

```go
func ConstructPrompt(query string, chunks []Chunk, canonSafe bool) string {
    prompt := "System: You are an AI writing assistant for NovelCraft.\n\n"
    prompt += "Canon-Safe Mode: " + canonSafeStr(canonSafe) + "\n\n"
    prompt += "Retrieved Context:\n---\n"

    for _, chunk := range chunks {
        source := fmt.Sprintf("[%s - %s]", chunk.Metadata["kind"], chunk.Metadata["title"])
        prompt += source + "\n"
        prompt += chunk.Text + "\n\n"
    }

    prompt += "---\n\nUser Question:\n" + query + "\n\n"
    prompt += "Instructions:\nAnswer the question using ONLY the retrieved context. Cite sources.\n"

    return prompt
}
```

---

## Step 6: OpenAI API Call

### Model: GPT-4o or GPT-5

**Pricing (as of early 2025):**
- GPT-4o: ~$2.50/1M input, ~$10/1M output
- GPT-5: ~$1.25/1M input, ~$10/1M output (estimated)

### API Call:

```go
func CallOpenAI(prompt string) (string, int, int, error) {
    client := openai.NewClient(apiKey)
    resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model: openai.GPT4o,
        Messages: []openai.ChatCompletionMessage{
            {Role: openai.ChatMessageRoleSystem, Content: prompt},
        },
        MaxTokens: 1000,
        Temperature: 0.7,
    })
    if err != nil {
        return "", 0, 0, err
    }

    answer := resp.Choices[0].Message.Content
    tokensIn := resp.Usage.PromptTokens
    tokensOut := resp.Usage.CompletionTokens

    return answer, tokensIn, tokensOut, nil
}
```

---

## Step 7: Citation Parsing

### Goal: Extract Sources from Response

**Example Response:**
```
According to Chapter 3, the crystal is first mentioned when Rhea finds it in the ruins.

Source: Chapter 3, paragraph 4
```

### Implementation:

- Parse "Source:" lines
- Match against chunk metadata
- Return list of citations with IDs

---

## Step 8: Cost Tracking

### Log Every Request:

```sql
INSERT INTO ai_requests (project_id, user_id, tool, model, tokens_in, tokens_out, cost_estimate_usd, latency_ms, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now());
```

### Calculate Cost:

```go
func CalculateCost(model string, tokensIn, tokensOut int) float64 {
    prices := map[string]struct{ in, out float64 }{
        "gpt-4o": {2.50, 10.00},
        "gpt-5":  {1.25, 10.00},
    }

    price := prices[model]
    costIn := float64(tokensIn) / 1_000_000 * price.in
    costOut := float64(tokensOut) / 1_000_000 * price.out

    return costIn + costOut
}
```

---

## Cost Optimization Strategies

### 1. Limit Chunk Count

- Retrieve top 5-10 chunks only
- More chunks = more cost
- Balance: precision vs cost

### 2. Cache System Prompt

- Lore Bible rules are static
- Cache the system prompt portion
- Reduces input tokens per request

### 3. Use Cheaper Models for Simple Tasks

| Task | Model | Rationale |
|------|-------|-----------|
| Q&A with citations | GPT-4o or GPT-5 | Need accuracy |
| Rewrite (simple) | GPT-4o-mini | Cheaper, good enough |
| Expand prose | GPT-4o or GPT-5 | Need quality |
| Summarize | GPT-4o-mini | Simple task |

### 4. Batch Requests

- If generating multiple suggestions, batch in one API call
- Reduces overhead

### 5. Token Budgets

- Set max tokens per request (e.g., 1,000 output tokens)
- Prevent runaway costs

### 6. Usage Limits

- Per-user daily limits (e.g., 50 requests/day)
- Or: Monthly budget (e.g., $10/month)

---

## Canon-Safe Mode

### Toggle Behavior:

**When ON:**
- System prompt includes: "Use ONLY retrieved context. Do not infer or invent."
- AI restricted to chunks + user notes
- No external knowledge allowed

**When OFF:**
- AI can suggest creative extensions
- Can brainstorm new ideas
- Still respects lore bible rules

### Implementation:

```go
if canonSafe {
    prompt += "CANON-SAFE MODE: You may ONLY use the retrieved context. Do not infer, invent, or extrapolate.\n"
} else {
    prompt += "You may suggest creative ideas, but flag any new lore additions.\n"
}
```

---

## Lore Bible Integration

### System Prompt Template:

```
You are an AI writing assistant for NovelCraft.

Your role:
- Preserve canon consistency
- Never invent lore facts unless instructed
- Maintain mystery and ambiguity
- Track canon layers: hard canon, perceived truth, suppressed truth, unknown

Writing Rules:
- Maintain character voice
- Preserve subtext and ambiguity
- Do not resolve mysteries early
- Avoid exposition dumps

Forbidden Actions:
- Introduce definitive answers to unresolved mysteries
- Explain hidden systems unless told "REVEAL"
- Retcon established canon
- Remove intentional ambiguity

[Rest of prompt...]
```

---

## Background Jobs

### Chunking Pipeline:

1. User saves chapter/wiki
2. Trigger background job (queue or goroutine)
3. Job:
   - Fetch text from DB
   - Chunk text
   - Generate embeddings (batch API call)
   - Delete old chunks for this document
   - Insert new chunks
   - Update `documents.updated_at`

### Queue Options:

- **Simple:** Goroutine + channel (for single-server)
- **Production:** Redis queue (e.g., `asynq`) or PostgreSQL-based queue

---

## Embedding Index Tuning

### ivfflat Index:

**Purpose:** Speed up vector similarity search

**Parameters:**
- `lists`: Number of clusters (default: 100)
- Trade-off: More lists = faster search, but lower recall

**Tuning:**
- Small dataset (<10K chunks): `lists = 100`
- Medium dataset (10K-100K chunks): `lists = 500`
- Large dataset (>100K chunks): `lists = 1000`

**Rebuild after bulk inserts:**
```sql
REINDEX INDEX chunks_embedding_idx;
```

---

## Testing RAG Pipeline

### Test Cases:

1. **Simple fact retrieval:**
   - Query: "What color are Rhea's eyes?"
   - Expected: Retrieve wiki page for Rhea, return correct color

2. **Cross-document search:**
   - Query: "Where did we first mention the crystal?"
   - Expected: Retrieve chapter with first mention, cite location

3. **Contradiction detection:**
   - Query: "Are there any contradictions about X?"
   - Expected: Retrieve conflicting chunks, list contradictions

4. **No answer:**
   - Query: "What is character Y's backstory?"
   - Expected: "Not found in text" (if not written yet)

### Metrics:

- **Precision:** Are retrieved chunks relevant?
- **Recall:** Are all relevant chunks retrieved?
- **Citation accuracy:** Do sources match actual text?

---

## Error Handling

### OpenAI API Errors:

- **429 (Rate Limit):** Retry with exponential backoff
- **500 (Server Error):** Retry up to 3 times
- **400 (Bad Request):** Log error, return to user

### Embedding Generation Errors:

- If embedding fails, mark document as "pending"
- Retry later

### Retrieval Errors:

- If no chunks found, return "No relevant content found"
- Don't fail silently

---

## Security & Privacy

### API Keys:

- Store in environment variables
- Never commit to git
- Rotate periodically

### Data Privacy:

- OpenAI API: Data not used for training (as of 2024)
- Enable zero data retention policy (OpenAI settings)

### User Data:

- Never expose other users' chunks in retrieval
- Always filter by `project_id` and check ownership

---

## Future Enhancements

### 1. Fine-Tuning (Optional)

- Train custom model on user's writing style
- Requires significant corpus (~10K examples)
- Expensive, consider only after MVP

### 2. Hybrid Search

- Combine vector search with keyword search (FTS)
- Improves precision for specific terms

### 3. Caching

- Cache embeddings for static wiki pages
- Cache frequent queries

### 4. Multi-Modal (Optional)

- Embed images (character portraits, maps)
- Use CLIP or similar for image+text retrieval

---

## Cost Example

### Scenario: 100K Word Novel

**Chunking:**
- 100K words ≈ 130K tokens
- Chunk into ~130 chunks (1,000 tokens each)
- Embedding cost: 130K tokens * $0.02/1M = **$0.0026**

**10 Q&A Requests:**
- Retrieve 10 chunks per request = ~10K tokens input
- Generate 500 tokens output per request
- Total: 10 * (10K input + 500 output) = 100K input + 5K output
- Cost: (100K * $1.25 + 5K * $10) / 1M = **$0.175**

**Monthly estimate (active use):** $5-20

---

## End Notes

RAG provides:
- **Cost efficiency** (only pay for relevant content)
- **Better answers** (focused context)
- **Citations** (know where info came from)
- **Privacy** (don't send full manuscript)

**Build RAG after writing MVP is solid. AI is useless without good content to retrieve.**
