-- =====================================================
-- SEED INITIAL INTEGRATIONS
-- =====================================================
-- Seed the integration catalog with v1 target integrations:
-- - CRM: HubSpot, Salesforce
-- - Payments: Stripe
-- - Support: Zendesk, Intercom
-- - Email: Gmail

-- HubSpot (CRM)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'hubspot',
    'HubSpot',
    'CRM platform for sales, marketing, and customer service',
    'CRM',
    'hubspot',
    '{"entity_types": ["contact", "company", "deal"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 60, "available_models": ["contacts", "companies", "deals"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["crm.objects.contacts.read", "crm.objects.companies.read", "crm.objects.deals.read"], "setup_url": "https://developers.hubspot.com/docs/api/overview"}'::jsonb
);

-- Salesforce (CRM)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'salesforce',
    'Salesforce',
    'Enterprise CRM platform for sales and customer relationships',
    'CRM',
    'salesforce',
    '{"entity_types": ["contact", "company", "deal", "lead"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 60, "available_models": ["Contact", "Account", "Opportunity", "Lead"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["api", "refresh_token", "id"], "setup_url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/"}'::jsonb
);

-- Stripe (PAYMENTS)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'stripe',
    'Stripe',
    'Payment processing and subscription management platform',
    'PAYMENTS',
    'stripe',
    '{"entity_types": ["customer", "subscription", "invoice", "payment"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 30, "available_models": ["customers", "subscriptions", "invoices", "charges"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["read_only"], "setup_url": "https://stripe.com/docs/api"}'::jsonb
);

-- Zendesk (SUPPORT)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'zendesk',
    'Zendesk',
    'Customer support and ticketing platform',
    'SUPPORT',
    'zendesk',
    '{"entity_types": ["contact", "ticket", "organization"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 60, "available_models": ["users", "tickets", "organizations"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["read"], "setup_url": "https://developer.zendesk.com/api-reference/"}'::jsonb
);

-- Intercom (SUPPORT)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'intercom',
    'Intercom',
    'Customer messaging and support platform',
    'SUPPORT',
    'intercom',
    '{"entity_types": ["contact", "company", "conversation"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 60, "available_models": ["contacts", "companies", "conversations"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["user.read", "company.read"], "setup_url": "https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis/"}'::jsonb
);

-- Gmail (EMAIL)
INSERT INTO integration_definitions (slug, name, description, category, nango_provider_key, capabilities, sync_config, auth_config)
VALUES (
    'gmail',
    'Gmail',
    'Email service with contact and message management',
    'EMAIL',
    'google-mail',
    '{"entity_types": ["contact"], "sync_directions": ["INBOUND"]}'::jsonb,
    '{"default_frequency_minutes": 120, "available_models": ["contacts"], "rate_limit_per_minute": 100}'::jsonb,
    '{"oauth_scopes": ["https://www.googleapis.com/auth/contacts.readonly"], "setup_url": "https://developers.google.com/gmail/api"}'::jsonb
);
