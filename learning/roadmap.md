# Learning Roadmap — Unified Security Hub

Ordered **most familiar → most novel** for someone with React + Node.js experience.

| #   | Layer                             | Why here                                                                            | Key files                                     |
| --- | --------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | **Frontend**                      | You know React — ground yourself with something familiar                            | `frontend/src/`                               |
| 2   | **Lambda API**                    | Node.js routing, just serverless instead of Express                                 | `api/lambda/index.mjs`                        |
| 3   | **SAST Scanner**                  | Node.js container — security concepts are new, code style isn't                     | `sast/backend/`                               |
| 4   | **Pentest Scanner + Test Target** | Same structure as SAST but tests live APIs; test-target is intentionally vulnerable | `pentest/backend/`                            |
| 5   | **AWS Orchestration**             | Step Functions, ECS, DynamoDB — the glue that runs the containers                   | `terraform/modules/sfn/`, `ecs/`, `dynamodb/` |
| 6   | **Infrastructure (Terraform)**    | VPC, subnets, IAM, the full cloud network — most novel                              | `terraform/`                                  |

## Key new concepts you'll encounter

| Concept                            | Where it lives                | Layer introduced |
| ---------------------------------- | ----------------------------- | ---------------- |
| Serverless functions (Lambda)      | `api/lambda/`                 | 2                |
| Pre-signed S3 URLs                 | `api/lambda/index.mjs`        | 2                |
| Docker containers on ECS Fargate   | `sast/`, `pentest/`           | 3, 4             |
| One-shot container pattern         | `sast/backend/index.js`       | 3                |
| SAST (static code analysis)        | `sast/backend/scanner.js`     | 3                |
| Penetration testing                | `pentest/backend/tester.js`   | 4                |
| Step Functions (state machines)    | `terraform/modules/sfn/`      | 5                |
| DynamoDB (NoSQL)                   | `terraform/modules/dynamodb/` | 5                |
| Terraform (Infrastructure as Code) | `terraform/`                  | 6                |
| VPC networking (subnets, NAT)      | `terraform/modules/VPC/`      | 6                |
| IAM roles and permissions          | throughout `terraform/`       | 6                |

## Progress

| Layer                             | Status      |
| --------------------------------- | ----------- |
| 1 — Frontend                      | ✅ complete |
| 2 — Lambda API                    | ✅ complete |
| 3 — SAST Scanner                  | ✅ complete |
| 4 — Pentest Scanner + Test Target | not started |
| 5 — AWS Orchestration             | not started |
| 6 — Infrastructure                | not started |
