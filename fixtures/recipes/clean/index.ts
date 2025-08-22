// Clean JSON-LD Recipe fixtures
import recipe1 from './recipe-1.json';
import recipe2 from './recipe-2.json';
import recipe3 from './recipe-3.json';
import recipe4 from './recipe-4.json';
import recipe5 from './recipe-5.json';
import recipe6 from './recipe-6.json';
import recipe7 from './recipe-7.json';
import recipe8 from './recipe-8.json';
import recipe9 from './recipe-9.json';
import recipe10 from './recipe-10.json';

// Individual exports
export { 
  recipe1, 
  recipe2, 
  recipe3, 
  recipe4, 
  recipe5, 
  recipe6, 
  recipe7, 
  recipe8, 
  recipe9, 
  recipe10 
};

// Array of all recipes
export const recipes = [
  recipe1,
  recipe2,
  recipe3,
  recipe4,
  recipe5,
  recipe6,
  recipe7,
  recipe8,
  recipe9,
  recipe10
];

// Object with recipes by ID
export const recipesById = {
  1: recipe1,
  2: recipe2,
  3: recipe3,
  4: recipe4,
  5: recipe5,
  6: recipe6,
  7: recipe7,
  8: recipe8,
  9: recipe9,
  10: recipe10
} as const;