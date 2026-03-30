-- Seed: Ad networks with sellers.json URLs
-- and known WordPress plugins for the intelligence pipeline

INSERT INTO AdNetworks (slug, name, sellers_json_url, createdAt) VALUES
  ('raptive', 'Raptive', 'https://ads.cafemedia.com/sellers.json', datetime('now')),
  ('mediavine', 'Mediavine', 'https://mediavine.com/sellers.json', datetime('now')),
  ('shemedia', 'SHE Media', 'https://ads.shemedia.com/sellers.json', datetime('now')),
  ('journey', 'Journey', 'https://sellers.journeymv.com/sellers.json', datetime('now')),
  ('pubnation', 'PubNation', 'https://sellers.pubnation.com/sellers.json', datetime('now')),
  ('monumetric', 'Monumetric', 'https://monumetric.com/sellers.json', datetime('now'));
--> statement-breakpoint

-- Known recipe plugins (competitors)
INSERT INTO Plugins (namespace, name, category, is_paid, is_competitor, replaceable_by_create, createdAt) VALUES
  ('wp-recipe-maker', 'WP Recipe Maker', 'recipe', 1, 1, 1, datetime('now')),
  ('flavor', 'Flavor', 'recipe', 0, 1, 1, datetime('now')),
  ('tasty-recipes', 'Tasty Recipes', 'recipe', 1, 1, 1, datetime('now')),
  ('jeherve-flavors-flavor', 'Flavor (Jeherve)', 'recipe', 0, 1, 1, datetime('now')),
  ('mv-create', 'Create', 'recipe', 1, 0, 0, datetime('now')),
  ('zip-recipes', 'Zip Recipes', 'recipe', 1, 1, 1, datetime('now')),
  ('easy-recipe', 'Easy Recipe', 'recipe', 0, 1, 1, datetime('now'));
--> statement-breakpoint

-- Known SEO plugins (not competitors, but useful for profiling)
INSERT INTO Plugins (namespace, name, category, is_paid, is_competitor, replaceable_by_create, createdAt) VALUES
  ('yoast', 'Yoast SEO', 'seo', 1, 0, 0, datetime('now')),
  ('rankmath', 'Rank Math', 'seo', 1, 0, 0, datetime('now')),
  ('aioseo', 'All in One SEO', 'seo', 1, 0, 0, datetime('now'));
--> statement-breakpoint

-- Known ad management / other plugins (buying behavior signals)
INSERT INTO Plugins (namespace, name, category, is_paid, is_competitor, replaceable_by_create, createdAt) VALUES
  ('mediavine-control-panel', 'Mediavine Control Panel', 'ads', 0, 0, 0, datetime('now')),
  ('wpforms', 'WPForms', 'forms', 1, 0, 0, datetime('now')),
  ('woocommerce', 'WooCommerce', 'ecommerce', 1, 0, 0, datetime('now'));
