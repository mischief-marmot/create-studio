-- Migration 0023: Seed USDA reference data for ingredient-specific unit conversion
-- Hand-curated from USDA SR Legacy dataset + authoritative baking references
-- Gram weights are per household measure (1 cup, 1 tbsp, 1 tsp)

-- Flours
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168936, 'wheat flour, white, all-purpose', 'Cereal Grains and Pasta', 0, 125, 7.8, 2.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168938, 'wheat flour, white, bread', 'Cereal Grains and Pasta', 0, 137, 8.6, 2.9);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168940, 'wheat flour, white, cake', 'Cereal Grains and Pasta', 0, 114, 7.1, 2.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168944, 'wheat flour, whole-grain', 'Cereal Grains and Pasta', 0, 120, 7.5, 2.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168920, 'rye flour, medium', 'Cereal Grains and Pasta', 0, 102, 6.4, 2.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168815, 'almond flour', 'Nut and Seed Products', 0, 96, 6.0, 2.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170187, 'coconut flour', 'Nut and Seed Products', 0, 112, 7.0, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169690, 'cornstarch', 'Cereal Grains and Pasta', 0, 128, 8.0, 2.7);

-- Sugars
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169655, 'sugars, granulated', 'Sweets', 0, 200, 12.5, 4.2);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168833, 'sugars, brown', 'Sweets', 0, 220, 13.8, 4.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169656, 'sugars, powdered', 'Sweets', 0, 120, 7.5, 2.5);

-- Fats
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (173410, 'butter, salted', 'Dairy and Egg Products', 0, 227, 14.2, 4.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (173430, 'butter, without salt', 'Dairy and Egg Products', 0, 227, 14.2, 4.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (173577, 'margarine, regular', 'Fats and Oils', 0, 227, 14.2, 4.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171412, 'shortening, household, soybean', 'Fats and Oils', 0, 205, 12.8, 4.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171401, 'lard', 'Fats and Oils', 0, 205, 12.8, 4.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171412, 'oil, coconut', 'Fats and Oils', 1, 218, 13.6, 4.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171413, 'oil, olive, salad or cooking', 'Fats and Oils', 1, 216, 13.5, 4.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (172336, 'oil, soybean, salad or cooking', 'Fats and Oils', 1, 218, 13.6, 4.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (172335, 'oil, canola', 'Fats and Oils', 1, 218, 13.6, 4.5);

-- Dairy (liquids)
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171265, 'milk, whole', 'Dairy and Egg Products', 1, 244, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171274, 'milk, nonfat, fluid', 'Dairy and Egg Products', 1, 245, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170856, 'cream, fluid, heavy whipping', 'Dairy and Egg Products', 1, 238, 14.9, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170857, 'cream, fluid, half and half', 'Dairy and Egg Products', 1, 242, 15.1, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170860, 'cream, sour, cultured', 'Dairy and Egg Products', 0, 230, 14.4, 4.8);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (173417, 'cheese, cream', 'Dairy and Egg Products', 0, 232, 14.5, 4.8);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170883, 'buttermilk, fluid, cultured', 'Dairy and Egg Products', 1, 245, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171284, 'yogurt, plain, whole milk', 'Dairy and Egg Products', 0, 245, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170886, 'yogurt, greek, plain', 'Dairy and Egg Products', 0, 245, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171270, 'milk, canned, evaporated', 'Dairy and Egg Products', 1, 252, 15.8, 5.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171271, 'milk, canned, condensed, sweetened', 'Dairy and Egg Products', 1, 306, 19.1, 6.4);

-- Cheese
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171241, 'cheese, parmesan, grated', 'Dairy and Egg Products', 0, 100, 6.3, 2.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171240, 'cheese, cheddar', 'Dairy and Egg Products', 0, 113, 7.1, 2.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171246, 'cheese, mozzarella, whole milk', 'Dairy and Egg Products', 0, 113, 7.1, 2.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171252, 'cheese, ricotta, whole milk', 'Dairy and Egg Products', 0, 246, 15.4, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171237, 'cheese, cottage, creamed', 'Dairy and Egg Products', 0, 225, 14.1, 4.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171243, 'cheese, feta', 'Dairy and Egg Products', 0, 150, 9.4, 3.1);

-- Leavening & Cocoa
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168942, 'leavening agents, baking powder', 'Baked Products', 0, 230, 13.8, 4.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168943, 'leavening agents, baking soda', 'Baked Products', 0, 230, 13.8, 4.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169593, 'cocoa, dry powder, unsweetened', 'Sweets', 0, 86, 5.4, 1.8);

-- Grains & Starches
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169756, 'rice, white, long-grain, regular, raw', 'Cereal Grains and Pasta', 0, 185, 11.6, 3.9);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169738, 'rice, brown, long-grain, raw', 'Cereal Grains and Pasta', 0, 185, 11.6, 3.9);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169706, 'oats, regular and quick', 'Cereal Grains and Pasta', 0, 81, 5.1, 1.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168917, 'cornmeal, whole-grain, yellow', 'Cereal Grains and Pasta', 0, 122, 7.6, 2.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (172018, 'bread crumbs, dry, grated', 'Baked Products', 0, 108, 6.8, 2.3);

-- Nuts & Seeds
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170567, 'nuts, almonds', 'Nut and Seed Products', 0, 143, 8.9, 3.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170187, 'nuts, walnuts, english', 'Nut and Seed Products', 0, 117, 7.3, 2.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170182, 'nuts, pecans', 'Nut and Seed Products', 0, 109, 6.8, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170178, 'peanuts, all types, raw', 'Legumes and Legume Products', 0, 146, 9.1, 3.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170162, 'nuts, cashew nuts, raw', 'Nut and Seed Products', 0, 137, 8.6, 2.9);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (172470, 'peanut butter, smooth', 'Legumes and Legume Products', 0, 258, 16.1, 5.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168588, 'nut butters, almond butter', 'Nut and Seed Products', 0, 258, 16.1, 5.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169414, 'seeds, flaxseed', 'Nut and Seed Products', 0, 168, 10.5, 3.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170554, 'seeds, chia seeds, dried', 'Nut and Seed Products', 0, 170, 10.6, 3.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170150, 'seeds, sesame seeds, whole, dried', 'Nut and Seed Products', 0, 144, 9.0, 3.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170148, 'seeds, sunflower seed kernels, dried', 'Nut and Seed Products', 0, 140, 8.8, 2.9);

-- Chocolate & Sweets
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170272, 'chocolate, dark, 60-69% cacao solids', 'Sweets', 0, 170, 10.6, 3.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170273, 'chocolate, dark, 70-85% cacao solids', 'Sweets', 0, 170, 10.6, 3.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168596, 'baking chocolate, white', 'Sweets', 0, 170, 10.6, 3.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168850, 'syrups, maple', 'Sweets', 1, 315, 19.7, 6.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169640, 'honey', 'Sweets', 1, 339, 21.2, 7.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168861, 'molasses', 'Sweets', 1, 328, 20.5, 6.8);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168849, 'syrups, corn, light', 'Sweets', 1, 341, 21.3, 7.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (169097, 'jams and preserves', 'Sweets', 0, 340, 21.3, 7.1);

-- Dried Fruit
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168165, 'raisins, seedless', 'Fruits and Fruit Juices', 0, 145, 9.1, 3.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168091, 'cranberries, dried, sweetened', 'Fruits and Fruit Juices', 0, 120, 7.5, 2.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168180, 'dates, medjool', 'Fruits and Fruit Juices', 0, 178, 11.1, 3.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168191, 'apricots, dried, sulfured', 'Fruits and Fruit Juices', 0, 130, 8.1, 2.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170175, 'coconut meat, dried, sweetened, shredded', 'Nut and Seed Products', 0, 93, 5.8, 1.9);

-- Salt & Spices
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170457, 'salt, table', 'Spices and Herbs', 0, 292, 18.3, 6.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170931, 'spices, pepper, black', 'Spices and Herbs', 0, 116, 7.3, 2.4);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170922, 'spices, cinnamon, ground', 'Spices and Herbs', 0, 125, 7.8, 2.6);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170932, 'spices, paprika', 'Spices and Herbs', 0, 109, 6.8, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170924, 'spices, cumin seed', 'Spices and Herbs', 0, 112, 7.0, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170921, 'spices, chili powder', 'Spices and Herbs', 0, 128, 8.0, 2.7);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170925, 'spices, garlic powder', 'Spices and Herbs', 0, 155, 9.7, 3.2);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170929, 'spices, onion powder', 'Spices and Herbs', 0, 110, 6.9, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170926, 'spices, ginger, ground', 'Spices and Herbs', 0, 96, 6.0, 2.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170928, 'spices, nutmeg, ground', 'Spices and Herbs', 0, 112, 7.0, 2.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170941, 'spices, turmeric, ground', 'Spices and Herbs', 0, 120, 7.5, 2.5);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170933, 'spices, oregano, dried', 'Spices and Herbs', 0, 48, 3.0, 1.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170940, 'spices, thyme, dried', 'Spices and Herbs', 0, 48, 3.0, 1.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170913, 'spices, basil, dried', 'Spices and Herbs', 0, 48, 3.0, 1.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170936, 'spices, rosemary, dried', 'Spices and Herbs', 0, 56, 3.5, 1.2);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170934, 'spices, parsley, dried', 'Spices and Herbs', 0, 30, 1.9, 0.6);

-- Liquids
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (174158, 'water, tap, drinking', 'Beverages', 1, 237, 14.8, 4.9);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (174300, 'soup, stock, chicken, ready-to-serve', 'Soups, Sauces, and Gravies', 1, 240, 15.0, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (174301, 'soup, stock, beef, ready-to-serve', 'Soups, Sauces, and Gravies', 1, 240, 15.0, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (174302, 'soup, stock, vegetable, ready-to-serve', 'Soups, Sauces, and Gravies', 1, 240, 15.0, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171009, 'vinegar, cider', 'Spices and Herbs', 1, 239, 14.9, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171010, 'vinegar, distilled', 'Spices and Herbs', 1, 239, 14.9, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171011, 'vinegar, red wine', 'Spices and Herbs', 1, 239, 14.9, 5.0);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (171012, 'vinegar, balsamic', 'Spices and Herbs', 1, 255, 15.9, 5.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (173480, 'soy sauce', 'Legumes and Legume Products', 1, 255, 15.9, 5.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (170874, 'vanilla extract', 'Spices and Herbs', 1, 208, 13.0, 4.3);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (167747, 'lemon juice, raw', 'Fruits and Fruit Juices', 1, 244, 15.3, 5.1);
INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (168155, 'lime juice, raw', 'Fruits and Fruit Juices', 1, 246, 15.4, 5.1);

-- Insert aliases (common recipe terms → USDA food names)

-- Flours
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('all-purpose flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ap flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('plain flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('self-rising flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('self rising flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, all-purpose'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('bread flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, bread'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('strong flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, bread'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cake flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, cake'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('pastry flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, white, cake'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('whole wheat flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, whole-grain'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('wholemeal flour', (SELECT id FROM usda_foods WHERE name = 'wheat flour, whole-grain'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('rye flour', (SELECT id FROM usda_foods WHERE name = 'rye flour, medium'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('almond flour', (SELECT id FROM usda_foods WHERE name = 'almond flour'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('coconut flour', (SELECT id FROM usda_foods WHERE name = 'coconut flour'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('corn starch', (SELECT id FROM usda_foods WHERE name = 'cornstarch'));

-- Sugars
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, granulated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('white sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, granulated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('granulated sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, granulated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('caster sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, granulated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('brown sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, brown'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('light brown sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, brown'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dark brown sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, brown'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('powdered sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, powdered'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('confectioners sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, powdered'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('icing sugar', (SELECT id FROM usda_foods WHERE name = 'sugars, powdered'));

-- Fats
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('butter', (SELECT id FROM usda_foods WHERE name = 'butter, salted'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('salted butter', (SELECT id FROM usda_foods WHERE name = 'butter, salted'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('unsalted butter', (SELECT id FROM usda_foods WHERE name = 'butter, without salt'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('margarine', (SELECT id FROM usda_foods WHERE name = 'margarine, regular'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('shortening', (SELECT id FROM usda_foods WHERE name = 'shortening, household, soybean'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('vegetable shortening', (SELECT id FROM usda_foods WHERE name = 'shortening, household, soybean'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('coconut oil', (SELECT id FROM usda_foods WHERE name = 'oil, coconut'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('olive oil', (SELECT id FROM usda_foods WHERE name = 'oil, olive, salad or cooking'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('vegetable oil', (SELECT id FROM usda_foods WHERE name = 'oil, soybean, salad or cooking'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('canola oil', (SELECT id FROM usda_foods WHERE name = 'oil, canola'));

-- Dairy
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('milk', (SELECT id FROM usda_foods WHERE name = 'milk, whole'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('whole milk', (SELECT id FROM usda_foods WHERE name = 'milk, whole'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('skim milk', (SELECT id FROM usda_foods WHERE name = 'milk, nonfat, fluid'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('heavy cream', (SELECT id FROM usda_foods WHERE name = 'cream, fluid, heavy whipping'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('whipping cream', (SELECT id FROM usda_foods WHERE name = 'cream, fluid, heavy whipping'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('half and half', (SELECT id FROM usda_foods WHERE name = 'cream, fluid, half and half'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sour cream', (SELECT id FROM usda_foods WHERE name = 'cream, sour, cultured'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cream cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, cream'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('buttermilk', (SELECT id FROM usda_foods WHERE name = 'buttermilk, fluid, cultured'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('yogurt', (SELECT id FROM usda_foods WHERE name = 'yogurt, plain, whole milk'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('greek yogurt', (SELECT id FROM usda_foods WHERE name = 'yogurt, greek, plain'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('evaporated milk', (SELECT id FROM usda_foods WHERE name = 'milk, canned, evaporated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('condensed milk', (SELECT id FROM usda_foods WHERE name = 'milk, canned, condensed, sweetened'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sweetened condensed milk', (SELECT id FROM usda_foods WHERE name = 'milk, canned, condensed, sweetened'));

-- Cheese
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('parmesan', (SELECT id FROM usda_foods WHERE name = 'cheese, parmesan, grated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('parmesan cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, parmesan, grated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cheddar cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, cheddar'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cheddar', (SELECT id FROM usda_foods WHERE name = 'cheese, cheddar'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('mozzarella', (SELECT id FROM usda_foods WHERE name = 'cheese, mozzarella, whole milk'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('mozzarella cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, mozzarella, whole milk'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ricotta', (SELECT id FROM usda_foods WHERE name = 'cheese, ricotta, whole milk'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ricotta cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, ricotta, whole milk'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cottage cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, cottage, creamed'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('feta', (SELECT id FROM usda_foods WHERE name = 'cheese, feta'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('feta cheese', (SELECT id FROM usda_foods WHERE name = 'cheese, feta'));

-- Leavening & Cocoa
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('baking powder', (SELECT id FROM usda_foods WHERE name = 'leavening agents, baking powder'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('baking soda', (SELECT id FROM usda_foods WHERE name = 'leavening agents, baking soda'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cocoa powder', (SELECT id FROM usda_foods WHERE name = 'cocoa, dry powder, unsweetened'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cocoa', (SELECT id FROM usda_foods WHERE name = 'cocoa, dry powder, unsweetened'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('unsweetened cocoa', (SELECT id FROM usda_foods WHERE name = 'cocoa, dry powder, unsweetened'));

-- Grains
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('rice', (SELECT id FROM usda_foods WHERE name = 'rice, white, long-grain, regular, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('white rice', (SELECT id FROM usda_foods WHERE name = 'rice, white, long-grain, regular, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('brown rice', (SELECT id FROM usda_foods WHERE name = 'rice, brown, long-grain, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('rolled oats', (SELECT id FROM usda_foods WHERE name = 'oats, regular and quick'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('oats', (SELECT id FROM usda_foods WHERE name = 'oats, regular and quick'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('oatmeal', (SELECT id FROM usda_foods WHERE name = 'oats, regular and quick'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cornmeal', (SELECT id FROM usda_foods WHERE name = 'cornmeal, whole-grain, yellow'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('breadcrumbs', (SELECT id FROM usda_foods WHERE name = 'bread crumbs, dry, grated'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('panko', (SELECT id FROM usda_foods WHERE name = 'bread crumbs, dry, grated'));

-- Nuts & Seeds
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('almonds', (SELECT id FROM usda_foods WHERE name = 'nuts, almonds'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('walnuts', (SELECT id FROM usda_foods WHERE name = 'nuts, walnuts, english'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('pecans', (SELECT id FROM usda_foods WHERE name = 'nuts, pecans'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('peanuts', (SELECT id FROM usda_foods WHERE name = 'peanuts, all types, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cashews', (SELECT id FROM usda_foods WHERE name = 'nuts, cashew nuts, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('peanut butter', (SELECT id FROM usda_foods WHERE name = 'peanut butter, smooth'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('almond butter', (SELECT id FROM usda_foods WHERE name = 'nut butters, almond butter'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('flax seeds', (SELECT id FROM usda_foods WHERE name = 'seeds, flaxseed'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('flaxseed', (SELECT id FROM usda_foods WHERE name = 'seeds, flaxseed'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('chia seeds', (SELECT id FROM usda_foods WHERE name = 'seeds, chia seeds, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sesame seeds', (SELECT id FROM usda_foods WHERE name = 'seeds, sesame seeds, whole, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sunflower seeds', (SELECT id FROM usda_foods WHERE name = 'seeds, sunflower seed kernels, dried'));

-- Chocolate & Sweets
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('chocolate chips', (SELECT id FROM usda_foods WHERE name = 'chocolate, dark, 60-69% cacao solids'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('semi-sweet chocolate chips', (SELECT id FROM usda_foods WHERE name = 'chocolate, dark, 60-69% cacao solids'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dark chocolate chips', (SELECT id FROM usda_foods WHERE name = 'chocolate, dark, 70-85% cacao solids'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('white chocolate chips', (SELECT id FROM usda_foods WHERE name = 'baking chocolate, white'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('maple syrup', (SELECT id FROM usda_foods WHERE name = 'syrups, maple'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('honey', (SELECT id FROM usda_foods WHERE name = 'honey'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('molasses', (SELECT id FROM usda_foods WHERE name = 'molasses'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('corn syrup', (SELECT id FROM usda_foods WHERE name = 'syrups, corn, light'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('jam', (SELECT id FROM usda_foods WHERE name = 'jams and preserves'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('jelly', (SELECT id FROM usda_foods WHERE name = 'jams and preserves'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('preserves', (SELECT id FROM usda_foods WHERE name = 'jams and preserves'));

-- Dried Fruit
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('raisins', (SELECT id FROM usda_foods WHERE name = 'raisins, seedless'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried cranberries', (SELECT id FROM usda_foods WHERE name = 'cranberries, dried, sweetened'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dates', (SELECT id FROM usda_foods WHERE name = 'dates, medjool'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried apricots', (SELECT id FROM usda_foods WHERE name = 'apricots, dried, sulfured'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('shredded coconut', (SELECT id FROM usda_foods WHERE name = 'coconut meat, dried, sweetened, shredded'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('desiccated coconut', (SELECT id FROM usda_foods WHERE name = 'coconut meat, dried, sweetened, shredded'));

-- Salt & Spices
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('salt', (SELECT id FROM usda_foods WHERE name = 'salt, table'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('table salt', (SELECT id FROM usda_foods WHERE name = 'salt, table'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('kosher salt', (SELECT id FROM usda_foods WHERE name = 'salt, table'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('sea salt', (SELECT id FROM usda_foods WHERE name = 'salt, table'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('black pepper', (SELECT id FROM usda_foods WHERE name = 'spices, pepper, black'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('pepper', (SELECT id FROM usda_foods WHERE name = 'spices, pepper, black'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cinnamon', (SELECT id FROM usda_foods WHERE name = 'spices, cinnamon, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ground cinnamon', (SELECT id FROM usda_foods WHERE name = 'spices, cinnamon, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('paprika', (SELECT id FROM usda_foods WHERE name = 'spices, paprika'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('cumin', (SELECT id FROM usda_foods WHERE name = 'spices, cumin seed'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ground cumin', (SELECT id FROM usda_foods WHERE name = 'spices, cumin seed'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('chili powder', (SELECT id FROM usda_foods WHERE name = 'spices, chili powder'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('garlic powder', (SELECT id FROM usda_foods WHERE name = 'spices, garlic powder'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('onion powder', (SELECT id FROM usda_foods WHERE name = 'spices, onion powder'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ginger', (SELECT id FROM usda_foods WHERE name = 'spices, ginger, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ground ginger', (SELECT id FROM usda_foods WHERE name = 'spices, ginger, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('nutmeg', (SELECT id FROM usda_foods WHERE name = 'spices, nutmeg, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('ground nutmeg', (SELECT id FROM usda_foods WHERE name = 'spices, nutmeg, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('turmeric', (SELECT id FROM usda_foods WHERE name = 'spices, turmeric, ground'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('oregano', (SELECT id FROM usda_foods WHERE name = 'spices, oregano, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried oregano', (SELECT id FROM usda_foods WHERE name = 'spices, oregano, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('thyme', (SELECT id FROM usda_foods WHERE name = 'spices, thyme, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried thyme', (SELECT id FROM usda_foods WHERE name = 'spices, thyme, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('basil', (SELECT id FROM usda_foods WHERE name = 'spices, basil, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried basil', (SELECT id FROM usda_foods WHERE name = 'spices, basil, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('rosemary', (SELECT id FROM usda_foods WHERE name = 'spices, rosemary, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried rosemary', (SELECT id FROM usda_foods WHERE name = 'spices, rosemary, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('parsley', (SELECT id FROM usda_foods WHERE name = 'spices, parsley, dried'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('dried parsley', (SELECT id FROM usda_foods WHERE name = 'spices, parsley, dried'));

-- Liquids
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('water', (SELECT id FROM usda_foods WHERE name = 'water, tap, drinking'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('broth', (SELECT id FROM usda_foods WHERE name = 'soup, stock, chicken, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('chicken broth', (SELECT id FROM usda_foods WHERE name = 'soup, stock, chicken, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('chicken stock', (SELECT id FROM usda_foods WHERE name = 'soup, stock, chicken, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('beef broth', (SELECT id FROM usda_foods WHERE name = 'soup, stock, beef, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('beef stock', (SELECT id FROM usda_foods WHERE name = 'soup, stock, beef, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('vegetable broth', (SELECT id FROM usda_foods WHERE name = 'soup, stock, vegetable, ready-to-serve'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('apple cider vinegar', (SELECT id FROM usda_foods WHERE name = 'vinegar, cider'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('white vinegar', (SELECT id FROM usda_foods WHERE name = 'vinegar, distilled'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('red wine vinegar', (SELECT id FROM usda_foods WHERE name = 'vinegar, red wine'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('balsamic vinegar', (SELECT id FROM usda_foods WHERE name = 'vinegar, balsamic'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('soy sauce', (SELECT id FROM usda_foods WHERE name = 'soy sauce'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('vanilla extract', (SELECT id FROM usda_foods WHERE name = 'vanilla extract'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('vanilla', (SELECT id FROM usda_foods WHERE name = 'vanilla extract'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('lemon juice', (SELECT id FROM usda_foods WHERE name = 'lemon juice, raw'));
INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('lime juice', (SELECT id FROM usda_foods WHERE name = 'lime juice, raw'));
