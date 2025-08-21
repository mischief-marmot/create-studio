// Schema.org HowTo types for JSON-LD structured data
export type HowToSupply = {
    '@type': 'HowToSupply';
    name: string;
    requiredQuantity?: {
        '@type': 'QuantitativeValue';
        value: number;
        unitText: string;
    };
    estimatedCost?: {
        '@type': 'MonetaryAmount';
        currency?: string;
        value?: string;
    };
};

export type HowToTool = {
    '@type': 'HowToTool';
    name: string;
    image?: string;
};

export type ImageObject = {
    '@type': 'ImageObject';
    url: string;
    height?: number;
    width?: number;
    caption?: string;
};

export type VideoObject = {
    '@type': 'VideoObject';
    name?: string;
    description?: string;
    thumbnailUrl?: string;
    contentUrl: string;
    embedUrl?: string;
    uploadDate?: string;
    duration?: string; // ISO 8601 duration format
};

export type HowToDirection = {
    '@type': 'HowToDirection';
    text: string;
    image?: ImageObject | ImageObject[];
    video?: VideoObject;
};

export type HowToTip = {
    '@type': 'HowToTip';
    text: string;
};

export type HowToStep = {
    '@type': 'HowToStep';
    name?: string;
    text?: string;
    image?: ImageObject | ImageObject[];
    video?: VideoObject;
    url?: string;
    supply?: HowToSupply[];
    tool?: HowToTool[];
    // Custom extensions for interactive features
    timer?: {
        duration: number; // seconds
        label: string;
        autoStart?: boolean;
    };
    notes?: {
        type: 'tip' | 'warning' | 'info';
        text: string;
    }[];
};

export type HowToSection = {
    '@type': 'HowToSection';
    name: string;
    itemListElement: HowToStep[];
};

export type MonetaryAmount = {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
};

export type Duration = string; // ISO 8601 duration format (e.g., "PT30M")

export type AggregateRating = {
    '@type': 'AggregateRating';
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
    ratingCount: number;
};

export type Person = {
    '@type': 'Person';
    name: string;
    url?: string;
};

export type HowTo = {
    '@context': 'https://schema.org';
    '@type': 'HowTo' | 'Recipe';
    name: string;
    description?: string;
    image?: ImageObject | ImageObject[];
    video?: VideoObject;
    author?: Person;
    datePublished?: string;
    dateModified?: string;
    prepTime?: Duration;
    cookTime?: Duration; // for recipes
    performTime?: Duration; // for non-recipes
    totalTime?: Duration;
    estimatedCost?: MonetaryAmount;
    supply?: HowToSupply[];
    tool?: HowToTool[];
    step: HowToStep[] | HowToSection[];
    yield?: string; // for recipes
    keywords?: string;
    aggregateRating?: AggregateRating;
    // Recipe-specific fields
    nutrition?: {
        '@type': 'NutritionInformation';
        calories?: string;
        carbohydrateContent?: string;
        proteinContent?: string;
        fatContent?: string;
        [key: string]: any;
    };
    recipeCategory?: string;
    recipeCuisine?: string;
    recipeIngredient?: string[]; // for recipes
    recipeInstructions?: HowToStep[] | HowToSection[];
    // Custom fields for interactive features
    difficulty?: 'easy' | 'medium' | 'hard';
    interactiveMode?: boolean;
};