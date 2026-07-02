-- Row-Level Security: tenant isolation at the database layer.
-- App already scopes by tenantId; this makes cross-tenant reads impossible
-- even if a query forgets the filter. Run in Supabase SQL editor.
--
-- Strategy: the app connects as a role that sets `app.tenant_id` per request.
-- For the Prisma service connection you can instead rely on app-layer scoping;
-- these policies harden any direct/anon access.

alter table "Tenant"         enable row level security;
alter table "User"           enable row level security;
alter table "Contact"        enable row level security;
alter table "Opportunity"    enable row level security;
alter table "Task"           enable row level security;
alter table "Conversation"   enable row level security;
alter table "Message"        enable row level security;
alter table "AiConversation" enable row level security;
alter table "AiMessage"      enable row level security;
alter table "AuditLog"       enable row level security;

-- Example policy pattern (repeat per tenant-scoped table):
-- create policy tenant_isolation on "Contact"
--   using ("tenantId" = current_setting('app.tenant_id', true));
--
-- Set per connection/request:  select set_config('app.tenant_id', '<tenantId>', true);
