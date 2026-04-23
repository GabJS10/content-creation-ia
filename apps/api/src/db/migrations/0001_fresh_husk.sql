ALTER TABLE "knowledge_sources" ADD COLUMN "error_message" varchar(500) DEFAULT '';--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD COLUMN "chunks_count" integer DEFAULT 0;