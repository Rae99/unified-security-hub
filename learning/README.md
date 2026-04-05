# Learning Notes — Unified Security Hub

This directory is your persistent learning companion. Notes live here so sessions can resume without relying on chat history.

## How to use this

- Read `roadmap.md` to see where you are and what's next
- Each `XX-topic.md` file covers one layer in depth
- `concepts/` has deep-dive explainers for patterns that show up multiple times
- Source files have `[LEARN]` comments pointing back here

## Roadmap

See [`roadmap.md`](roadmap.md) for the full table. Summary:

| # | Layer | Status |
|---|-------|--------|
| 1 | Frontend (React SPA) | ✅ complete |
| 2 | Lambda API | not started |
| 3 | SAST Scanner | not started |
| 4 | Pentest Scanner + Test Target | not started |
| 5 | AWS Orchestration (Step Functions, ECS, DynamoDB) | not started |
| 6 | Infrastructure (Terraform, VPC, IAM) | not started |

## Concepts Index

Deep-dive files will be added here as we work through each layer.

| Concept | File | Introduced in |
|---------|------|--------------|
| `preventDefault()` | [concepts/prevent-default.md](concepts/prevent-default.md) | Layer 1 — Frontend |
| What is an API | [concepts/what-is-an-api.md](concepts/what-is-an-api.md) | Layer 1 — Frontend |
| `useRef` and DOM access | [concepts/useref-and-dom.md](concepts/useref-and-dom.md) | Layer 1 — Frontend |

## Vocabulary Glossary

Key terms you'll encounter. Definitions are plain English.

| Term | Plain-English meaning |
|------|-----------------------|
| **Lambda** | A function that runs in the cloud when called — no server to manage, AWS handles the rest |
| **ECS Fargate** | A way to run Docker containers in AWS without managing any servers |
| **Step Functions** | A visual "state machine" — a flowchart that AWS executes for you, step by step |
| **DynamoDB** | AWS's NoSQL database — like a giant key-value store, no SQL, no fixed schema |
| **Terraform** | A tool where you write config files that describe cloud infrastructure, and it builds it for you |
| **VPC** | Virtual Private Cloud — your own isolated network inside AWS |
| **Subnet** | A slice of the VPC — some are public (internet-accessible), some are private |
| **NAT Gateway** | Lets private-subnet resources reach the internet (one-way: out only) |
| **IAM Role** | A set of AWS permissions attached to a service so it can do things (like read S3, write DynamoDB) |
| **Pre-signed URL** | A temporary S3 URL the frontend can use to upload/download directly — no credentials needed |
| **ECR** | Elastic Container Registry — AWS's version of Docker Hub for storing your Docker images |
| **GSI** | Global Secondary Index — an extra index on a DynamoDB table that lets you query by non-PK fields |
| **SAST** | Static Application Security Testing — analyzing source code for vulnerabilities without running it |
| **Pentest** | Penetration testing — actively probing a running API to find exploitable weaknesses |
| **SNS** | Simple Notification Service — pub/sub messaging; used here to send alerts for high-severity findings |
| **CORS** | Cross-Origin Resource Sharing — browser rule that controls which domains can call your API |
| **ESM** | ES Modules — the modern `import/export` style in JavaScript (vs. older `require()` CommonJS style) |
