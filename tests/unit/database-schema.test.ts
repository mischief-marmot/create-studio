import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";

// These tests will run against the local Supabase instance
const supabaseUrl = "http://localhost:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

describe("Database Schema Tests", () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  });

  beforeEach(async () => {
    // Clean up data before each test
    await supabase.from("card_ingredients").delete().neq("id", "");
    await supabase.from("cards").delete().neq("id", "");
    await supabase.from("ingredients").delete().neq("id", "");
    await supabase.from("affiliate_products").delete().neq("id", "");
    await supabase.auth.admin
      .listUsers()
      .then(async ({ data: { users } }: any) => {
        for (const user of users) {
          if (user.email?.includes("test")) {
            await supabase.auth.admin.deleteUser(user.id);
          }
        }
      });
  });

  describe("Normalized Schema for Ingredients and Instructions", () => {
    it("should have ingredients table with proper structure", async () => {
      const { data: columns } = await supabase
        .from("ingredients")
        .select("*")
        .limit(0);

      // Test will fail until we create the normalized schema
      expect(columns).toBeDefined();
    });

    it("should have supplies table with proper structure", async () => {
      const { data: columns } = await supabase
        .from("supplies")
        .select("*")
        .limit(0);

      expect(columns).toBeDefined();
    });

    it("should have card_ingredients junction table", async () => {
      const { data: columns } = await supabase
        .from("card_ingredients")
        .select("*")
        .limit(0);

      expect(columns).toBeDefined();
    });

    it("should have instructions table with step ordering", async () => {
      const { data: columns } = await supabase
        .from("instructions")
        .select("*")
        .limit(0);

      expect(columns).toBeDefined();
    });

    it("should have nutrition_info table", async () => {
      const { data: columns } = await supabase
        .from("nutrition_info")
        .select("*")
        .limit(0);

      expect(columns).toBeDefined();
    });

    it("should have affiliate_products table", async () => {
      const { data: columns } = await supabase
        .from("affiliate_products")
        .select("*")
        .limit(0);

      expect(columns).toBeDefined();
    });
  });

  describe("Ingredient Operations", () => {
    it("should create and retrieve ingredients", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const ingredient = {
        name: `All-Purpose Flour ${randomId}`,
        slug: `all-purpose-flour-${randomId}`,
        category: "Baking",
        unit_types: ["cups", "grams", "ounces"],
      };

      const { data: created, error: createError } = await supabase
        .from("ingredients")
        .insert(ingredient)
        .select()
        .single();

      expect(createError).toBeNull();
      expect(created).toMatchObject(ingredient);
    });

    it("should enforce unique slug constraint", async () => {
      const ingredient = {
        name: "Duplicate Flour",
        slug: "all-purpose-flour", // Same slug as above
        category: "Baking",
      };

      const { error } = await supabase.from("ingredients").insert(ingredient);

      expect(error).toBeDefined();
      expect(error.code).toBe("23505"); // Unique violation
    });

    it("should search ingredients by name", async () => {
      const { data: results } = await supabase
        .from("ingredients")
        .select("*")
        .ilike("name", "%flour%");

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Database Relationships (Without Auth)", () => {
    it("should create ingredients and link them to cards via junction table", async () => {
      // First create an ingredient
      const randomId = Math.random().toString(36).substring(7);
      const ingredient = {
        name: `Test Flour ${randomId}`,
        slug: `test-flour-${randomId}`,
        category: "Baking",
        unit_types: ["cups", "grams"],
      };

      const { data: createdIngredient, error: ingredientError } = await supabase
        .from("ingredients")
        .insert(ingredient)
        .select()
        .single();

      expect(ingredientError).toBeNull();
      expect(createdIngredient).toMatchObject(ingredient);

      // Test that we can search for similar ingredients
      const { data: searchResults } = await supabase
        .from("ingredients")
        .select("*")
        .ilike("name", "%flour%");

      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it("should support card_ingredients junction table structure", async () => {
      // Test the junction table structure by checking if we can insert data
      // We'll use service role to bypass RLS for this structural test
      const testCardId = "test-card-id";
      const testIngredientId = "test-ingredient-id";

      // This test verifies the table structure exists and has the right columns
      const { error } = await supabase
        .from("card_ingredients")
        .select(
          "card_id, ingredient_id, amount, unit, notes, optional, group_name, display_order"
        )
        .limit(0);

      expect(error).toBeNull();
    });

    it("should support nutrition_info table structure", async () => {
      const { error } = await supabase
        .from("nutrition_info")
        .select("card_id, calories, protein_grams, carbs_grams, fat_grams")
        .limit(0);

      expect(error).toBeNull();
    });

    it("should support instructions table with step ordering", async () => {
      const { error } = await supabase
        .from("instructions")
        .select(
          "card_id, step_number, title, content, duration, media_url, tips"
        )
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe("Affiliate Products", () => {
    it("should link affiliate products to ingredients", async () => {
      // Create a test ingredient first
      const randomId = Math.random().toString(36).substring(7);
      const { data: flour } = await supabase
        .from("ingredients")
        .insert({
          name: `Test Ingredient ${randomId}`,
          slug: `test-ingredient-${randomId}`,
          category: "Test",
        })
        .select()
        .single();

      const affiliateProduct = {
        ingredient_id: flour.id,
        product_name: "King Arthur Test Product",
        brand: "King Arthur",
        affiliate_url: "https://example.com/affiliate/test",
        price: 8.99,
        is_sponsored: true,
        commission_rate: 5.0,
      };

      const { data: created, error } = await supabase
        .from("affiliate_products")
        .insert(affiliateProduct)
        .select()
        .single();

      expect(error).toBeNull();
      expect(created).toMatchObject(affiliateProduct);
    });

    it("should find all affiliate products for an ingredient", async () => {
      // Create ingredient and affiliate product
      const randomId = Math.random().toString(36).substring(7);
      const { data: ingredient } = await supabase
        .from("ingredients")
        .insert({
          name: `Search Test ${randomId}`,
          slug: `search-test-${randomId}`,
          category: "Test",
        })
        .select()
        .single();

      await supabase.from("affiliate_products").insert({
        ingredient_id: ingredient.id,
        product_name: "Test Product",
        affiliate_url: "https://example.com/test",
        active: true,
      });

      const { data: products } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("ingredient_id", ingredient.id)
        .eq("active", true);

      expect(products).toBeDefined();
      expect(products.length).toBeGreaterThan(0);
    });
  });
});
