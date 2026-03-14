# Hedge Fund Assistant — Technical Specification

## 1. Purpose

Build a research assistant that turns a private research repository into structured, monitorable investment intelligence. The system should ingest documents such as broker research, Substack posts, transcripts, filings, and internal notes; extract themes and claims; connect them to market context from Alpha Vantage; and produce thesis memos, idea cards, watchlists, and monitoring alerts.

The assistant is designed as a research copilot, not an execution engine. It should help generate theses, surface emerging trends, rank trading ideas, and monitor whether existing theses are strengthening or breaking.

## 2. Goals

### Primary goals
- Ingest heterogeneous research documents from a local repository.
- Convert documents into structured metadata and searchable chunks.
- Identify themes, sectors, tickers, catalysts, and risks.
- Generate evidence-backed thesis memos.
- Produce ranked idea candidates using research plus Alpha Vantage market context.
- Detect emerging trends over time.
- Monitor active theses and alert on confirming or disconfirming evidence.

### Non-goals
- Direct order routing or execution.
- Fully autonomous portfolio management.
- Blind trust in generated conclusions without evidence links.
- Use of market data as the sole driver of idea generation.

## 3. Users

### Primary user
A discretionary investor or analyst with a private research library containing third-party research, newsletters, and notes.

### Secondary users
- Small research teams
- PM/analyst workflows
- Sector specialists maintaining watchlists and theme maps

## 4. Core user stories

1. As a user, I want to drop new PDFs, HTML exports, and notes into a repository and have them automatically parsed and tagged.
2. As a user, I want to search the repository semantically for a theme like "AI power bottleneck" and retrieve the most relevant excerpts and related names.
3. As a user, I want the system to generate a clean investment thesis memo from a set of research inputs.
4. As a user, I want the system to propose long, short, and watchlist ideas based on repeated evidence across independent sources.
5. As a user, I want to know which themes are gaining momentum across documents over time.
6. As a user, I want the system to monitor active theses and tell me what has strengthened or weakened.
7. As a user, I want every claim in an output to be traceable to supporting sources.

## 5. Functional requirements

### 5.1 Ingestion
The system shall:
- Watch one or more repository folders for new or changed files.
- Support PDF, text, Markdown, HTML, email export, and simple DOCX ingestion.
- Extract document text, metadata, and source type.
- Deduplicate near-identical documents.
- Version documents when content changes.

### 5.2 Parsing and enrichment
The system shall:
- Split documents into semantic chunks.
- Extract title, date, author, source, and publication type where available.
- Identify tickers, companies, sectors, geographies, macro topics, and themes.
- Extract claims, catalysts, risks, stance, and stated horizon.
- Assign confidence scores to extracted attributes.

### 5.3 Search and retrieval
The system shall:
- Support keyword search and semantic search.
- Filter by source, date range, ticker, sector, theme, and stance.
- Return source-linked chunks and document-level summaries.
- Retrieve evidence packs for a given thesis or idea.

### 5.4 Thesis generation
The system shall:
- Generate one-page thesis memos from selected documents or theme clusters.
- Separate direct evidence from model inference.
- Include supporting evidence, counterarguments, catalysts, risks, and falsification conditions.
- Save generated theses in a registry for later monitoring.

### 5.5 Idea generation
The system shall:
- Generate candidate longs, shorts, baskets, or pairs from theme clusters.
- Use Alpha Vantage market context to add trend, relative strength, volume, and volatility checks.
- Rank ideas using a configurable scoring model.
- Produce compact idea cards with evidence links.

### 5.6 Trend detection
The system shall:
- Compare recent document windows versus longer historical baselines.
- Detect accelerating theme mentions, new ticker-theme links, and changes in stance or breadth.
- Surface emerging trends only when supported by minimum evidence thresholds.

### 5.7 Monitoring and alerts
The system shall:
- Maintain a thesis registry with active, watching, and archived statuses.
- Re-score theses daily or on demand.
- Identify new confirming and disconfirming evidence.
- Generate alerts for thesis strengthening, thesis weakening, new catalysts, and price confirmation/disconfirmation.

### 5.8 Reporting
The system shall produce:
- Daily brief
- Weekly theme report
- Thesis memos
- Idea cards
- Watchlist report
- Thesis monitor report

## 6. Non-functional requirements

### Reliability
- Batch jobs should be restartable.
- Every generated object should be reproducible from stored inputs and prompts.
- Failed ingestion of one document should not stop the whole pipeline.

### Explainability
- Every output should include source references.
- The system should clearly label evidence, inference, and uncertainty.

### Performance
- New documents should be available for search within 5 minutes in normal operation.
- Daily reports should complete within a configurable batch window.

### Security
- The repository is private and may contain licensed research.
- Access should be local or within a trusted environment.
- Secrets, including Alpha Vantage API keys, must be stored securely.

### Extensibility
- New data sources, parsers, and scoring features should be pluggable.
- Model providers should be swappable.

## 7. System architecture

```text
Repository -> Ingestion -> Parser/Enrichment -> Storage + Indexes -> Agents -> Reports/UI
                                         \-> Alpha Vantage market context /
```

### Major components
1. Ingestion service
2. Parsing and extraction service
3. Metadata store
4. Vector index
5. Thesis registry
6. Alpha Vantage client
7. Agent orchestration layer
8. Reporting layer
9. Optional lightweight dashboard/API

## 8. Proposed repository layout

```text
hedge-fund-assistant/
  config/
    settings.yaml
    prompts/
  data/
    raw/
      gs/
      substack/
      notes/
      transcripts/
      filings/
    processed/
    cache/
  reports/
    daily/
    weekly/
    theses/
    idea_cards/
  src/
    ingest/
    parse/
    enrich/
    storage/
    retrieval/
    alpha_vantage/
    agents/
    scoring/
    monitoring/
    reporting/
    utils/
  tests/
  scripts/
  README.md
```

## 9. Data model

### 9.1 Document
```json
{
  "doc_id": "string",
  "source": "GS | Substack | Note | Transcript | Filing | Other",
  "source_detail": "string",
  "title": "string",
  "author": "string",
  "published_at": "ISO-8601",
  "ingested_at": "ISO-8601",
  "file_path": "string",
  "content_hash": "string",
  "language": "string",
  "tickers": ["string"],
  "companies": ["string"],
  "sectors": ["string"],
  "themes": ["string"],
  "geographies": ["string"],
  "stance": "bullish | bearish | mixed | neutral | unknown",
  "time_horizon": "string",
  "summary": "string",
  "catalysts": ["string"],
  "risks": ["string"],
  "claims": ["string"],
  "confidence": {
    "metadata": 0.0,
    "entities": 0.0,
    "stance": 0.0
  }
}
```

### 9.2 Chunk
```json
{
  "chunk_id": "string",
  "doc_id": "string",
  "position": 12,
  "text": "string",
  "embedding_id": "string",
  "tickers": ["string"],
  "themes": ["string"],
  "claims": ["string"]
}
```

### 9.3 Thesis
```json
{
  "thesis_id": "string",
  "name": "string",
  "status": "watching | active | archived | broken",
  "direction": "long | short | relative | thematic",
  "horizon": "string",
  "summary": "string",
  "variant_perception": "string",
  "supporting_doc_ids": ["string"],
  "related_tickers": ["string"],
  "catalysts": ["string"],
  "risks": ["string"],
  "validation_signals": ["string"],
  "break_signals": ["string"],
  "score": 0.0,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

### 9.4 Idea
```json
{
  "idea_id": "string",
  "thesis_id": "string",
  "ticker": "string",
  "direction": "long | short | pair | basket",
  "why_now": "string",
  "research_score": 0.0,
  "market_score": 0.0,
  "catalyst_score": 0.0,
  "final_score": 0.0,
  "status": "new | watch | actionable | archived",
  "supporting_doc_ids": ["string"],
  "next_checkpoints": ["string"]
}
```

### 9.5 Trend signal
```json
{
  "signal_id": "string",
  "theme": "string",
  "window_start": "ISO-8601",
  "window_end": "ISO-8601",
  "baseline_window_days": 90,
  "recent_window_days": 14,
  "mention_acceleration": 0.0,
  "breadth_change": 0.0,
  "stance_shift": 0.0,
  "supporting_doc_ids": ["string"],
  "related_tickers": ["string"]
}
```

## 10. Storage design

### Recommended initial stack
- Postgres for structured objects
- pgvector for embeddings and semantic retrieval
- Local filesystem or object store for originals and parsed text cache
- SQLite acceptable for prototyping

### Core tables
- documents
- chunks
- entities
- document_entities
- theses
- thesis_evidence
- ideas
- trend_signals
- market_snapshots
- jobs
- prompts

## 11. Alpha Vantage integration

### Supported use cases
- Daily adjusted prices
- Intraday prices where needed
- Volume and volatility context
- Relative strength versus peers or ETFs
- Simple technical features such as moving average position and breakout state

### Market feature examples
- 20d / 60d return
- rolling volatility
- price vs 50dma / 200dma
- average daily dollar volume
- relative return vs benchmark ETF
- volume z-score

### Design rules
- Market data informs prioritization, not thesis truth.
- Cache API responses to avoid rate-limit pressure.
- Separate raw responses from derived features.

## 12. Agent design

Use specialized agents rather than one monolithic agent.

### 12.1 Research summarizer
Input: one document
Output:
- summary
- key claims
- tickers
- themes
- catalysts
- risks
- stance
- horizon

### 12.2 Theme extractor
Input: multiple enriched documents
Output:
- theme clusters
- subthemes
- ticker-theme graph
- representative evidence

### 12.3 Trend detector
Input: recent vs historical document windows
Output:
- accelerating themes
- new ticker-theme links
- stance shifts
- breadth changes

### 12.4 Thesis generator
Input: selected evidence pack
Output:
- one-page thesis memo
- supporting evidence list
- variant perception
- disconfirmation conditions

### 12.5 Idea generator
Input: theme cluster + market context
Output:
- long/short candidates
- watchlist candidates
- ranked idea objects

### 12.6 Thesis critic
Input: thesis memo
Output:
- strongest counterarguments
- priced-in concerns
- missing evidence
- invalidation tests

### 12.7 Monitor agent
Input: active thesis + new evidence + market features
Output:
- stronger/weaker/no change assessment
- score delta
- alert record

## 13. Pipelines

### 13.1 Ingestion pipeline
1. Detect new or modified file
2. Identify file type and source family
3. Extract raw text
4. Normalize and clean
5. Deduplicate
6. Persist document
7. Chunk text
8. Run extraction and enrichment
9. Create embeddings
10. Index into search

### 13.2 Daily pipeline
1. Ingest new documents
2. Refresh embeddings and metadata
3. Build recent evidence packs
4. Run trend detector
5. Re-score active theses
6. Fetch market snapshots from Alpha Vantage for linked tickers
7. Rank idea candidates
8. Produce daily brief and alerts

### 13.3 Weekly pipeline
1. Re-cluster themes
2. Refresh watchlists
3. Produce top themes report
4. Archive stale ideas
5. Run evaluation metrics

## 14. Scoring framework

### 14.1 Research conviction score
Inputs:
- source quality
- number of independent supporting sources
- recency
- specificity
- novelty
- catalyst clarity

### 14.2 Market confirmation score
Inputs:
- relative strength
- trend persistence
- volume confirmation
- volatility suitability
- liquidity

### 14.3 Thesis quality score
Inputs:
- causal clarity
- evidence density
- falsifiability
- counterargument quality
- asymmetry

### 14.4 Final idea score
```text
final_score =
  0.35 * research_conviction +
  0.25 * trend_strength +
  0.20 * market_confirmation +
  0.10 * catalyst_proximity +
  0.10 * risk_reward
```

### Suggested labels
- 8.5+: actionable
- 7.0 to 8.4: watch closely
- 5.5 to 6.9: exploratory
- below 5.5: archive or ignore

## 15. Prompt contracts

### Document summarization prompt contract
Input:
- raw document text
- source metadata if known
Output JSON fields:
- title
- summary
- tickers
- themes
- stance
- time_horizon
- catalysts
- risks
- claims
- confidence

### Thesis generation prompt contract
Input:
- evidence pack
- optional focus theme
Output sections:
- summary
- why now
- variant perception
- supporting evidence
- key tickers
- catalysts
- risks
- disconfirmation conditions

### Critic prompt contract
Input:
- thesis memo
Output sections:
- strongest bear case
- alternative explanations
- priced-in risks
- missing evidence
- invalidation tests

### Trend detection prompt contract
Input:
- recent cluster stats
- historical baseline stats
- top supporting snippets
Output:
- theme
- why it is emerging
- evidence threshold check
- related names
- confidence

## 16. Output templates

### Daily brief
```text
Top emerging themes
Top new ideas
Theses strengthening
Theses weakening
Names with strongest research + market alignment
Important upcoming catalysts
```

### Thesis memo
```text
Title
Direction
Horizon
Summary
Why now
Variant perception
Supporting evidence
Key tickers
Catalysts
Risks
What would disprove this
Next things to monitor
```

### Idea card
```text
Ticker
Theme
Direction
Final score
Why now
Supporting evidence
Technical context
Catalysts
Key risk
Action
```

## 17. API surface

### Internal service endpoints
- `POST /ingest/file`
- `POST /ingest/folder/scan`
- `GET /documents/{doc_id}`
- `POST /search`
- `POST /themes/rebuild`
- `POST /theses/generate`
- `POST /ideas/generate`
- `POST /monitor/run`
- `GET /reports/daily/latest`

### Search request example
```json
{
  "query": "AI power bottleneck beneficiaries",
  "filters": {
    "source": ["GS", "Substack"],
    "date_from": "2026-01-01",
    "tickers": ["VRT", "ETN"]
  },
  "top_k": 10
}
```

## 18. Evaluation plan

### Offline evaluation
Track:
- extraction accuracy on a labeled sample
- theme clustering coherence
- retrieval relevance
- thesis memo factual grounding
- alert precision

### Human evaluation
Score outputs on:
- usefulness
- novelty
- evidence quality
- actionability
- clarity

### Operational metrics
- ingestion success rate
- average processing latency
- cost per document
- cache hit rate for Alpha Vantage

## 19. Guardrails

- Every generated output must include source provenance.
- The assistant must distinguish source-derived claims from inferred conclusions.
- Every thesis must include a bear case or critic section.
- Every idea must include invalidation conditions.
- No automated execution.
- Optional compliance mode should exclude restricted sources or redact sensitive content from summaries.

## 20. Risks and mitigations

### Risk: hallucinated extraction
Mitigation:
- structured JSON outputs
- schema validation
- confidence scoring
- fallback to raw excerpt review

### Risk: duplicate narratives from syndicated research
Mitigation:
- deduplication and source independence weighting

### Risk: overreaction to noisy recent mentions
Mitigation:
- minimum evidence thresholds
- recent vs baseline comparison
- stance and source diversity checks

### Risk: API rate limits
Mitigation:
- caching
- scheduled batching
- precomputed features

### Risk: low trust in generated theses
Mitigation:
- evidence links
- critic mode
- explicit uncertainty sections

## 21. Recommended implementation phases

### Phase 1: Foundation
- folder ingestion
- PDF/HTML/text parsing
- metadata extraction
- chunking and embeddings
- search API

### Phase 2: Structured intelligence
- theme extraction
- document summaries
- thesis registry
- thesis generation

### Phase 3: Market context
- Alpha Vantage client
- feature computation
- market snapshots
- idea scoring

### Phase 4: Monitoring
- daily jobs
- trend detector
- thesis monitor
- alerts and daily brief

### Phase 5: Evaluation and hardening
- metrics dashboards
- prompt versioning
- regression tests
- false-positive review loop

## 22. MVP definition

### Inputs
- local research repository
- Alpha Vantage API key
- optional watchlist CSV

### MVP features
- ingest and parse new docs
- semantic + keyword search
- document summaries with tickers/themes
- emerging theme report
- thesis memo generation
- Alpha Vantage-backed watchlist ranking
- daily brief output as Markdown

### MVP deliverables
- CLI or local web app
- Postgres schema
- ingestion jobs
- prompt library
- report templates

## 23. Open questions

- What file formats dominate the repository today?
- Should the initial UI be CLI-first, notebook-first, or web-first?
- Do you want thesis status managed manually, automatically, or hybrid?
- Should trend detection operate globally or by sector book?
- Do you want support for internal notes with stronger weighting than external research?

## 24. Recommended first build target

Build a local-first V1 that ingests the repository, creates structured summaries and semantic search, detects top emerging themes, and produces a daily report plus ranked watchlist. That delivers value quickly while preserving a clean path to richer thesis monitoring later.

## 25. NanoClaw integration guide (beginner-friendly)

This section explains how to connect the hedge fund assistant to NanoClaw in the simplest possible way.

### 25.1 What NanoClaw does in this setup

Think of the system as two parts:

1. **Your hedge fund assistant** does the real research work.
   - Reads your research files
   - Searches documents
   - Generates thesis memos
   - Uses Alpha Vantage for market context
   - Writes reports

2. **NanoClaw** is the safe operator.
   - Runs commands in a container
   - Keeps the work isolated from your main computer
   - Lets you trigger jobs by chat or command line
   - Can run jobs on a schedule

A simple mental model:

```text
You ask NanoClaw for a task
        ↓
NanoClaw opens a safe container
        ↓
The container runs your hedge-fund-assistant scripts
        ↓
The scripts read research and write reports
        ↓
NanoClaw returns the result to you
```

### 25.2 The easiest integration strategy

Start with the easiest version.

Do **not** try to deeply modify NanoClaw itself.
Instead:
- keep your hedge-fund-assistant as a separate folder
- make it runnable with simple commands
- let NanoClaw call those commands inside a container

This is called a **thin integration**.
It is easier, safer, and much more realistic for a first version.

### 25.3 Recommended folder setup on your computer

Create one main folder on your computer called `hedge_workspace`.
Inside it, make these folders:

```text
hedge_workspace/
  research_repo/
  hedge_fund_assistant/
  reports/
  secrets/
```

What each folder is for:

- `research_repo/`
  - your GS research PDFs
  - Substack exports
  - notes
  - transcripts
  - filings
  - this should be treated as the source library

- `hedge_fund_assistant/`
  - the code that parses files, searches them, builds theses, and pulls Alpha Vantage data

- `reports/`
  - daily briefs
  - thesis memos
  - watchlist reports
  - this is where output files go

- `secrets/`
  - your Alpha Vantage key stored outside the codebase
  - keep this private

### 25.4 What to mount into the NanoClaw container

When NanoClaw starts a container, it should only see the folders it needs.

Use this plan:

```text
On your computer                          Inside the container
-----------------------------------------------------------------
hedge_workspace/research_repo/      ->    /workspace/research
hedge_workspace/hedge_fund_assistant/ ->  /workspace/app
hedge_workspace/reports/            ->    /workspace/reports
hedge_workspace/secrets/            ->    /workspace/secrets
```

Recommended permissions:
- `/workspace/research` = read-only
- `/workspace/app` = read-only if possible
- `/workspace/reports` = read-write
- `/workspace/secrets` = read-only

Why this matters:
- the agent can read your research
- the agent can run your code
- the agent can write reports
- the agent cannot casually modify your research library

### 25.5 What the hedge fund assistant must expose

Your assistant should provide a few simple commands. Keep them short and predictable.

Use a `scripts/` folder inside `hedge_fund_assistant/`.

Recommended scripts:

```text
hedge_fund_assistant/
  scripts/
    ingest_new_docs.py
    build_index.py
    generate_daily_brief.py
    generate_thesis.py
    rank_watchlist.py
    monitor_theses.py
    search_research.py
```

What each script should do:

- `ingest_new_docs.py`
  - reads new files from `/workspace/research`
  - extracts text
  - stores structured metadata

- `build_index.py`
  - updates search indexes / embeddings
  - makes the library searchable

- `generate_daily_brief.py`
  - summarizes new material
  - finds themes
  - checks linked market data
  - writes a report to `/workspace/reports`

- `generate_thesis.py`
  - creates a thesis memo for one topic or basket

- `rank_watchlist.py`
  - uses research + Alpha Vantage context to rank names

- `monitor_theses.py`
  - checks whether existing theses are strengthening or weakening

- `search_research.py`
  - lets NanoClaw ask questions like “What recent documents discuss AI power bottlenecks?”

### 25.6 The exact command contract NanoClaw should use

NanoClaw should call scripts with simple commands like these:

```bash
python /workspace/app/scripts/ingest_new_docs.py
python /workspace/app/scripts/build_index.py
python /workspace/app/scripts/generate_daily_brief.py
python /workspace/app/scripts/generate_thesis.py --theme "AI power bottleneck"
python /workspace/app/scripts/rank_watchlist.py
python /workspace/app/scripts/monitor_theses.py
python /workspace/app/scripts/search_research.py --query "European defense electronics"
```

This is the key integration rule:

**NanoClaw should not need to know your business logic.**
It only needs to know which command to run.

### 25.7 A very simple instruction file for NanoClaw

Create a file called `CLAUDE.md` in the project workspace or wherever NanoClaw expects project instructions.

Use plain instructions like this:

```md
# Hedge Fund Assistant Instructions

You are a research assistant operating inside a restricted container.

Folders:
- /workspace/research contains source research documents. Treat as read-only.
- /workspace/app contains the hedge fund assistant code.
- /workspace/reports is where you should write outputs.
- /workspace/secrets contains secrets such as the Alpha Vantage API key.

Allowed tasks:
- ingest new research documents
- build or refresh the search index
- generate daily briefs
- generate thesis memos
- rank watchlist names
- monitor existing theses
- answer research questions using source documents

Rules:
- never modify source research documents
- never invent evidence
- always separate direct evidence from inference
- every thesis must include risks and disconfirming evidence
- never place trades
- never delete prior reports unless explicitly instructed
```

This file helps keep the agent focused and safe.

### 25.8 Where the Alpha Vantage key should live

Store your Alpha Vantage key in the `secrets/` folder, not inside the code.

Example file:

```text
hedge_workspace/secrets/alpha_vantage.env
```

Example content:

```text
ALPHA_VANTAGE_API_KEY=your_real_key_here
```

Your code should read the key from that file or from an environment variable.

Beginner rule:
- do not hardcode the API key directly in Python files
- do not commit the key into git
- do not store the key inside research documents

### 25.9 What a daily workflow should look like

A simple daily flow should be:

1. ingest new research documents
2. rebuild or refresh the index
3. identify major new themes
4. pull Alpha Vantage data for linked names
5. produce a daily brief
6. save the brief to `/workspace/reports/daily/`

In plain English:

```text
New docs come in
→ assistant reads them
→ assistant updates search
→ assistant finds the important themes
→ assistant checks price/volume context
→ assistant writes today’s summary
```

### 25.10 The first three jobs to automate in NanoClaw

Start with only these three jobs.

#### Job 1: Morning daily brief
Purpose:
- summarize what is new
- tell you the most important themes
- rank a few names to watch

Command sequence:

```bash
python /workspace/app/scripts/ingest_new_docs.py
python /workspace/app/scripts/build_index.py
python /workspace/app/scripts/generate_daily_brief.py
```

Output:
- `/workspace/reports/daily/daily_brief_YYYY_MM_DD.md`

#### Job 2: On-demand thesis memo
Purpose:
- produce a memo when you ask for a theme

Example command:

```bash
python /workspace/app/scripts/generate_thesis.py --theme "AI cooling and power"
```

Output:
- `/workspace/reports/theses/ai_cooling_and_power.md`

#### Job 3: Thesis monitor
Purpose:
- tell you whether existing theses are getting stronger or weaker

Example command:

```bash
python /workspace/app/scripts/monitor_theses.py
```

Output:
- `/workspace/reports/monitor/thesis_monitor_YYYY_MM_DD.md`

### 25.11 What you should be able to ask NanoClaw

Once this is wired up, you should be able to type prompts like:

- “Generate today’s daily brief.”
- “Create a thesis memo on AI power bottleneck beneficiaries.”
- “Rank the top watchlist names using the latest research and Alpha Vantage data.”
- “Which themes accelerated in the last 14 days?”
- “What has strengthened or weakened in the European defense thesis this week?”

NanoClaw should then choose the right script to run.

### 25.12 The simplest beginner-friendly implementation order

Build in this order:

#### Step 1
Get the folder structure in place.

#### Step 2
Make `ingest_new_docs.py` work.
Goal: the system can read documents and store structured text.

#### Step 3
Make `build_index.py` work.
Goal: the system can search your research repository.

#### Step 4
Make `generate_daily_brief.py` work.
Goal: you get one useful daily report.

#### Step 5
Make `generate_thesis.py` work.
Goal: you can ask for a memo on any theme.

#### Step 6
Add `rank_watchlist.py`.
Goal: use Alpha Vantage to prioritize names.

#### Step 7
Add `monitor_theses.py`.
Goal: ongoing upkeep and alerts.

This order matters because it creates value early without needing the whole system finished.

### 25.13 A sample end-to-end run

Here is what a normal morning run should look like.

#### Input
You add 5 new research files into `research_repo/`.

#### NanoClaw run
NanoClaw executes:

```bash
python /workspace/app/scripts/ingest_new_docs.py
python /workspace/app/scripts/build_index.py
python /workspace/app/scripts/generate_daily_brief.py
```

#### What happens behind the scenes
- documents are parsed
- themes and tickers are extracted
- the search index is updated
- Alpha Vantage is queried for linked names
- the assistant writes a report

#### Output
A Markdown file appears in:

```text
/workspace/reports/daily/
```

Example contents:
- top emerging themes
- top 5 names with strongest supporting evidence
- theses strengthening
- theses weakening
- important upcoming catalysts

### 25.14 Beginner-friendly success criteria

The first version is good enough if it can reliably do these five things:

1. read new documents without breaking
2. search your research library
3. write a daily summary
4. create a thesis memo from a theme
5. use Alpha Vantage to add market context

Do not aim for full automation on day one.
A good first version is one that is boring, reliable, and easy to understand.

### 25.15 Things not to do in version 1

Avoid these early mistakes:

- do not let the agent edit your research library
- do not build broker execution into the system
- do not create too many agent roles too early
- do not depend on perfect theme extraction before building reports
- do not make NanoClaw responsible for all business logic

Keep NanoClaw simple.
Let your own scripts do the actual research work.

### 25.16 Suggested checklist for setup

#### Workspace checklist
- create `hedge_workspace/`
- create `research_repo/`
- create `hedge_fund_assistant/`
- create `reports/`
- create `secrets/`

#### Script checklist
- create `ingest_new_docs.py`
- create `build_index.py`
- create `generate_daily_brief.py`
- create `generate_thesis.py`
- create `rank_watchlist.py`
- create `monitor_theses.py`

#### Safety checklist
- research mounted read-only
- reports mounted read-write
- secrets stored outside code
- clear `CLAUDE.md` rules written
- no trade execution paths

### 25.17 Recommended first milestone

The best first milestone is:

**“I can drop research files into a folder, ask NanoClaw for a daily brief, and get a readable report back.”**

If that works, the rest becomes much easier to build.

### 25.18 Recommended next milestone after that

Once the daily brief works, the next milestone should be:

**“I can ask NanoClaw to generate a thesis memo on any theme using my research repository plus Alpha Vantage context.”**

That will prove the whole design is working end-to-end.

