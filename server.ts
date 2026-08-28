import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Server-side Gemini AI Client with User-Agent header
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// Helper for fallback generation if API key is missing or encounters rate limit
function generateFallbackPartyPlan(input: any) {
  const guestTotal = (Number(input.adults) || 12) + (Number(input.kids) || 0);
  const adults = Number(input.adults) || 12;
  const duration = Number(input.duration) || 3;
  const budget = Number(input.budget) || 350;
  const theme = input.theme || "Celebration";
  const eventType = input.eventType || "Party";

  // Calculate drink formula: 2 drinks first hr + 1 drink each subsequent hr per adult
  const drinksPerAdult = 2 + Math.max(0, duration - 1);
  const totalDrinks = adults * drinksPerAdult;
  const wineBottles = Math.ceil((totalDrinks * 0.35) / 5);
  const beerCans = Math.ceil(totalDrinks * 0.4);
  const sodaOrWater = Math.ceil(guestTotal * 3);
  const iceBagsLbs = Math.ceil(guestTotal * 1.5);

  return {
    title: `${theme} ${eventType}`,
    vibeDescription: `A festive and vibrant ${theme.toLowerCase()} themed gathering for ${guestTotal} guests with curated decor, crowd-pleasing bites, and signature refreshments.`,
    guestCount: { adults, kids: Number(input.kids) || 0, total: guestTotal },
    budget: { target: budget, tier: input.budgetTier || "balanced", currency: "$" },
    drinkFormula: {
      drinksPerAdult,
      totalDrinks,
      wineBottles,
      beerCans,
      sodaCans: Math.ceil(sodaOrWater * 0.6),
      waterBottlesOrGal: `${Math.ceil(guestTotal * 0.5)} Gallons`,
      iceLbs: iceBagsLbs,
    },
    foodFormula: {
      appetizersPerPerson: duration > 3 ? 8 : 5,
      mainCoursePortions: guestTotal,
      dessertServings: Math.ceil(guestTotal * 1.2),
      recommendedStyle: guestTotal > 15 ? "Buffet & Grazing Board" : "Family Style Platters",
    },
    shoppingList: [
      {
        id: "item-1",
        name: `${theme} Themed Garland & Balloon Arch Kit`,
        category: "decor",
        store: "Party / Amazon",
        quantity: 1,
        unit: "kit",
        estimatedPrice: 24.99,
        purchased: false,
        priority: "must_have",
        notes: "Setup 3 hours before guests arrive",
      },
      {
        id: "item-2",
        name: "Warm Fairy String Lights & Centerpiece Accents",
        category: "decor",
        store: "Dollar Store / General",
        quantity: 3,
        unit: "packs",
        estimatedPrice: 12.0,
        purchased: false,
        priority: "nice_to_have",
      },
      {
        id: "item-3",
        name: "Eco-Friendly Compostable Plates & Bowls (50 pk)",
        category: "tableware",
        store: "Costco / Wholesale",
        quantity: 1,
        unit: "pack",
        estimatedPrice: 16.5,
        purchased: false,
        priority: "must_have",
      },
      {
        id: "item-4",
        name: "Heavy-Duty Recyclable Cutlery & Cocktail Napkins (100 pk)",
        category: "tableware",
        store: "Costco / Wholesale",
        quantity: 1,
        unit: "pack",
        estimatedPrice: 14.0,
        purchased: false,
        priority: "must_have",
      },
      {
        id: "item-5",
        name: "Artisanal Cheese & Charcuterie Grazing Board Essentials",
        category: "food",
        store: "Costco / Wholesale",
        quantity: 1,
        unit: "bundle",
        estimatedPrice: 48.0,
        purchased: false,
        priority: "must_have",
        dietaryTag: "Crowd Pleaser",
      },
      {
        id: "item-6",
        name: "Fresh Gourmet Sliders / Pulled Pork Rolls & Slaw",
        category: "food",
        store: "Grocery / Supermarket",
        quantity: Math.ceil(guestTotal * 1.5),
        unit: "servings",
        estimatedPrice: 65.0,
        purchased: false,
        priority: "must_have",
        dietaryTag: "Main",
      },
      {
        id: "item-7",
        name: "Rainbow Veggie Sticks with Roasted Garlic Hummus",
        category: "food",
        store: "Grocery / Supermarket",
        quantity: 2,
        unit: "platters",
        estimatedPrice: 18.5,
        purchased: false,
        priority: "must_have",
        dietaryTag: "Vegan / GF",
      },
      {
        id: "item-8",
        name: "Assorted Craft Beer & Seltzers (Variety 24-pk)",
        category: "drinks",
        store: "Costco / Wholesale",
        quantity: Math.ceil(beerCans / 24) || 1,
        unit: "cases",
        estimatedPrice: 29.99,
        purchased: false,
        priority: "must_have",
      },
      {
        id: "item-9",
        name: "Chilled Prosecco / Crisp White Wine",
        category: "drinks",
        store: "Liquor Store",
        quantity: wineBottles || 3,
        unit: "bottles",
        estimatedPrice: 38.0,
        purchased: false,
        priority: "must_have",
      },
      {
        id: "item-10",
        name: "Sparkling Flavored Waters & Citrus Garnishes",
        category: "drinks",
        store: "Grocery / Supermarket",
        quantity: 2,
        unit: "12-packs",
        estimatedPrice: 14.0,
        purchased: false,
        priority: "must_have",
        dietaryTag: "Non-Alcoholic",
      },
      {
        id: "item-11",
        name: "Party Ice Bags (10 lb bags)",
        category: "ice_utility",
        store: "Grocery / Supermarket",
        quantity: Math.ceil(iceBagsLbs / 10),
        unit: "bags",
        estimatedPrice: 7.5,
        purchased: false,
        priority: "must_have",
        notes: "Pick up last on party day morning",
      },
      {
        id: "item-12",
        name: "Custom Celebration Cupcakes / Mini Cheesecakes",
        category: "food",
        store: "Bakery",
        quantity: Math.ceil(guestTotal * 1.2),
        unit: "pieces",
        estimatedPrice: 32.0,
        purchased: false,
        priority: "nice_to_have",
        dietaryTag: "Dessert",
      },
      {
        id: "item-13",
        name: "Interactive Party Trivia / Yard Games",
        category: "activities",
        store: "Party / Amazon",
        quantity: 1,
        unit: "set",
        estimatedPrice: 15.0,
        purchased: false,
        priority: "nice_to_have",
      },
    ],
    timeline: [
      {
        id: "time-1",
        phase: "1_week_before",
        task: "Finalize guest count, theme playlist, and order online decorations/supplies",
        completed: false,
        category: "prep",
      },
      {
        id: "time-2",
        phase: "3_days_before",
        task: "Complete Costco & Wholesale grocery run for dry goods, drinks, tableware",
        completed: false,
        category: "shopping",
      },
      {
        id: "time-3",
        phase: "1_day_before",
        task: "Prep marinades, chop veggies, charge speaker, and hang major ambient decor",
        completed: false,
        category: "prep",
      },
      {
        id: "time-4",
        phase: "day_of_morning",
        task: "Pick up fresh bakery orders and ice; chill beverages in coolers",
        completed: false,
        category: "chill_ice",
      },
      {
        id: "time-5",
        phase: "1_hour_before",
        task: "Set out cold appetizers, start party background music, light candles/strings",
        completed: false,
        category: "host",
      },
    ],
    tipsAndHacks: [
      "The 1.5 lb ice per person rule ensures you never run dry for cocktails and chilling coolers.",
      "Pre-batch your signature cocktail in a beverage dispenser so you enjoy the party instead of bartending.",
      "Group your shopping run: Bulk dry goods at wholesale 3 days before, fresh items & ice on party day.",
      "Set out two trash & recycling stations near the drink area to cut post-party cleanup time by 75%.",
    ],
    signatureRecipe: {
      name: `${theme} Sunset Citrus Punch`,
      type: "punch",
      servings: guestTotal,
      ingredients: [
        "4 cups Fresh Orange Juice",
        "2 cups Cranberry or Pomegranate Juice",
        "1 cup Fresh Lime Juice",
        "4 cups Ginger Ale or Prosecco",
        "Sliced blood oranges, limes, and fresh mint for garnish",
      ],
      instructions: [
        "In a large party dispenser or punch bowl, combine orange, cranberry, and lime juices.",
        "Chill until 30 minutes before guests arrive.",
        "Add chilled ginger ale or prosecco and a large decorative ice ring.",
        "Garnish liberally with citrus wheels and mint sprigs.",
      ],
    },
  };
}

// 1. Generate Full Party Shopping Blueprint
app.post("/api/plan-party", async (req, res) => {
  try {
    const {
      eventType = "Birthday Party",
      theme = "Retro Neon Disco",
      adults = 15,
      kids = 0,
      budget = 400,
      budgetTier = "balanced",
      duration = 4,
      venueType = "backyard",
      dietary = {},
      specialRequests = "",
    } = req.body;

    const totalGuests = Number(adults) + Number(kids);
    const ai = getGenAI();

    if (!ai) {
      console.log("No GEMINI_API_KEY set, using smart dynamic fallback plan.");
      const fallback = generateFallbackPartyPlan({
        eventType,
        theme,
        adults,
        kids,
        budget,
        budgetTier,
        duration,
        venueType,
        dietary,
      });
      return res.json({ success: true, plan: fallback, source: "fallback" });
    }

    const prompt = `You are an elite Party Planner & Shopping Specialist Agent.
Generate a comprehensive, mathematically sound, budget-conscious party shopping blueprint.

Input Details:
- Event Type: ${eventType}
- Theme & Atmosphere: ${theme}
- Adults: ${adults}, Kids: ${kids} (Total Guests: ${totalGuests})
- Party Duration: ${duration} hours
- Venue: ${venueType}
- Target Budget: $${budget} (Tier: ${budgetTier})
- Dietary Requirements: ${JSON.stringify(dietary)}
- Custom Notes/Requests: ${specialRequests || "None"}

Requirements:
1. Shopping list MUST be grouped into realistic categories (food, drinks, decor, tableware, activities, ice_utility, favors).
2. Recommend the best store for each item: ('Costco / Wholesale', 'Grocery / Supermarket', 'Party / Amazon', 'Liquor Store', 'Bakery', 'Dollar Store / General', 'Specialty').
3. Calculate mathematically precise quantities (drinks per adult based on duration, ice calculation at ~1.5 lbs/person, finger foods/servings, plates 1.5x guest count).
4. Estimated prices MUST fit closely within the target budget ($${budget}).
5. Include a signature drink recipe (alcoholic or mocktail batch punch) scaled for ${totalGuests} guests.
6. Provide a stress-free prep & shopping timeline.
7. Include 4 practical party hosting hacks.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Short descriptive party title",
  "vibeDescription": "Vibrant 2-sentence vibe description",
  "guestCount": { "adults": ${adults}, "kids": ${kids}, "total": ${totalGuests} },
  "budget": { "target": ${budget}, "tier": "${budgetTier}", "currency": "$" },
  "drinkFormula": {
    "drinksPerAdult": number,
    "totalDrinks": number,
    "wineBottles": number,
    "beerCans": number,
    "sodaCans": number,
    "waterBottlesOrGal": "string",
    "iceLbs": number
  },
  "foodFormula": {
    "appetizersPerPerson": number,
    "mainCoursePortions": number,
    "dessertServings": number,
    "recommendedStyle": "string"
  },
  "shoppingList": [
    {
      "id": "item-1",
      "name": "Item name with specifics",
      "category": "food" | "drinks" | "decor" | "tableware" | "activities" | "ice_utility" | "favors",
      "store": "Costco / Wholesale" | "Grocery / Supermarket" | "Party / Amazon" | "Liquor Store" | "Bakery" | "Dollar Store / General" | "Specialty",
      "quantity": number,
      "unit": "packs" | "bottles" | "bags" | "lbs" | "cans" | "kits" | "pieces" | "servings",
      "estimatedPrice": number,
      "purchased": false,
      "priority": "must_have" | "nice_to_have" | "optional",
      "dietaryTag": "Vegan / GF / etc or null",
      "notes": "Helpful shopping or prep tip"
    }
  ],
  "timeline": [
    {
      "id": "time-1",
      "phase": "1_week_before" | "3_days_before" | "1_day_before" | "day_of_morning" | "1_hour_before" | "during_party",
      "task": "Specific actionable milestone",
      "completed": false,
      "category": "shopping" | "prep" | "decor" | "chill_ice" | "host"
    }
  ],
  "tipsAndHacks": [
    "Tip 1", "Tip 2", "Tip 3", "Tip 4"
  ],
  "signatureRecipe": {
    "name": "Recipe Name",
    "type": "punch" | "cocktail" | "mocktail" | "dish",
    "servings": ${totalGuests},
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse failed on Gemini response:", parseErr);
      parsed = generateFallbackPartyPlan({
        eventType,
        theme,
        adults,
        kids,
        budget,
        budgetTier,
        duration,
      });
    }

    // Ensure item IDs are clean and unique
    if (parsed.shoppingList && Array.isArray(parsed.shoppingList)) {
      parsed.shoppingList = parsed.shoppingList.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${idx}`,
        purchased: false,
      }));
    }

    return res.json({ success: true, plan: parsed, source: "gemini" });
  } catch (error: any) {
    console.error("Error generating party plan:", error);
    const fallback = generateFallbackPartyPlan(req.body || {});
    return res.json({ success: true, plan: fallback, source: "fallback_on_error", error: error.message });
  }
});

// 2. Interactive Agent Chat & Modification Engine for CymbalMart Assistant
app.post("/api/agent-chat", async (req, res) => {
  try {
    const { message, currentPlan, chatHistory = [] } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Rule-based conversational smart replies when API key is pending
      const lower = (message || "").toLowerCase();
      let replyText = "Hello! I'm your CymbalMart Assistant. ";
      let action = null;
      let itemsToAdd: any[] = [];

      if (lower.includes("aisle") || lower.includes("where") || lower.includes("find") || lower.includes("location")) {
        replyText +=
          "Here is a quick CymbalMart Aisle Directory:\n• Aisles 1-2: Fresh Produce & Salads\n• Aisle 3: Bakery & Breads\n• Aisles 4-5: Pantry, Chips, Dips & Crackers\n• Aisle 6: Butcher & Seafood\n• Aisle 7: Deli Platters & Artisan Cheeses\n• Aisle 8: Beverages, Seltzers, Beers & Wine\n• Aisle 9: Party Supplies, Tableware & Decor\n• Aisle 10: Ice Freezers & Frozen Appetizers.";
      } else if (lower.includes("budget") || lower.includes("save") || lower.includes("cheaper") || lower.includes("cymbal choice")) {
        replyText +=
          "At CymbalMart, switching to our **Cymbal Choice** store brand saves customers an average of 22% without sacrificing gourmet quality! You can also consolidate dry goods and seltzers in our Cymbal Club bulk section.";
      } else if (lower.includes("drink") || lower.includes("alcohol") || lower.includes("wine") || lower.includes("beer") || lower.includes("ice")) {
        const adults = currentPlan?.guestCount?.adults || 12;
        const dur = currentPlan?.durationHours || 3;
        const total = adults * (2 + Math.max(0, dur - 1));
        replyText += `For ${adults} guests over ${dur} hours, CymbalMart recommends ~${total} total servings: approximately ${Math.ceil(
          (total * 0.35) / 5
        )} bottles of wine (Aisle 8), ${Math.ceil(total * 0.4)} beers/seltzers (Aisle 8), and ${Math.ceil(
          adults * 1.5
        )} lbs of ice from our front freezers (Aisle 10).`;
      } else if (lower.includes("deli") || lower.includes("platter") || lower.includes("catering") || lower.includes("prep")) {
        replyText +=
          "Our CymbalMart Fresh Deli (Aisle 7) offers ready-to-serve Charcuterie Grazing Platters, Artisan Sandwich Sliders, and Fresh Fruit/Veggie Trays that save hosts 2-3 hours of kitchen prep time!";
        itemsToAdd = [
          {
            name: "CymbalMart Deli Artisan Grazing Board Platter",
            category: "food",
            store: "CymbalMart Produce & Deli",
            brand: "Cymbal Choice",
            aisle: "Aisle 7 (Deli)",
            quantity: 1,
            unit: "platter",
            estimatedPrice: 38.0,
            priority: "must_have",
            notes: "Ready-to-serve from CymbalMart Deli counter",
          },
        ];
      } else if (lower.includes("vegan") || lower.includes("gluten") || lower.includes("diet") || lower.includes("allergy")) {
        replyText +=
          "CymbalMart carries dedicated Organic & Allergen-Free sections in Aisles 1 and 4! I can help you add gluten-free crackers, vegan mezze dips, and dairy-free sweet treats.";
      } else {
        replyText += `I'm here to assist you with everything at CymbalMart for your "${currentPlan?.title || "Event"}". We currently have ${
          currentPlan?.shoppingList?.length || 0
        } items mapped across your store aisles. How can I help you today (recipe recommendations, aisle navigation, budget savings, or party formulas)?`;
      }

      return res.json({
        success: true,
        reply: replyText,
        suggestedActions: [
          { label: "Switch to Cymbal Choice Brand (-22%)", actionType: "OPTIMIZE_BUDGET" },
          { label: "CymbalMart Aisle Directory", actionType: "AISLE_INFO" },
          { label: "Check Beverage & Ice Formula", actionType: "CHECK_DRINKS" },
          { label: "Add Deli Catering Platter", actionType: "ADD_DELI" },
        ],
        itemsToAdd,
      });
    }

    const systemPrompt = `You are the **CymbalMart Assistant**, an intelligent, friendly, and expert customer service & party shopping chatbot for CymbalMart supermarket customers.
Your role:
1. Assist customers with party planning, grocery item recommendations, aisle directions, recipe batch scaling, drink math, and budget optimization.
2. Promote customer value: highlight **Cymbal Choice** (our high-quality store brand that saves ~22%), CymbalMart Fresh Deli platters (Aisle 7), in-store bakery (Aisle 3), and ice/beverage logistics (Aisles 8 & 10).
3. Provide crisp, structured store navigation with exact aisle numbers when asked where items are located:
   - Aisles 1-2: Fresh Produce & Salads
   - Aisle 3: Bakery & Custom Cakes
   - Aisles 4-5: Pantry, Snacks, Sauces, Dips
   - Aisle 6: Fresh Meat, Poultry & Seafood
   - Aisle 7: Deli Platters & Gourmet Cheeses
   - Aisle 8: Beverages, Seltzers, Beers & Wine
   - Aisle 9: Party Tableware, Napkins, Cutlery & Decor
   - Aisle 10: Ice Freezers & Frozen Appetizers
4. Customer Event Context:
   - Event: ${currentPlan?.title}
   - Headcount: ${currentPlan?.guestCount?.adults} adults, ${currentPlan?.guestCount?.kids} kids
   - Target Budget: $${currentPlan?.budget?.target}
   - Items in cart: ${currentPlan?.shoppingList?.length || 0} items
   - Drink Formula: ${JSON.stringify(currentPlan?.drinkFormula || {})}

Tone: Warm, prompt, knowledgeable, and customer-first. Use concise bullet points for recipes or multi-step advice.

Return ONLY valid JSON matching this structure:
{
  "reply": "Conversational, helpful response for the CymbalMart customer.",
  "suggestedActions": [
    { "label": "Button text", "actionType": "string", "payload": {} }
  ],
  "itemsToAdd": [
    {
      "name": "Item name with brand/flavor",
      "category": "food" | "drinks" | "decor" | "tableware" | "activities" | "ice_utility" | "favors",
      "store": "CymbalMart Produce & Deli" | "CymbalMart Bakery" | "CymbalMart Butcher & Seafood" | "CymbalMart Grocery & Pantry" | "CymbalMart Cellars & Beverages" | "CymbalMart Party & Tableware" | "CymbalMart Ice & Frozen" | "Cymbal Club Wholesale Bulk",
      "brand": "Cymbal Choice" | "Cymbal Organic" | "Cymbal Club Bulk" | "Brand Name",
      "aisle": "Aisle X (Department)",
      "quantity": number,
      "unit": "pack" | "bottles" | "bags" | "lbs" | "cans" | "kits" | "pieces" | "servings",
      "estimatedPrice": number,
      "priority": "must_have" | "nice_to_have" | "optional",
      "notes": "Shopping tip or storage advice"
    }
  ]
}`;

    const conversationContext = chatHistory
      .slice(-6)
      .map((m: any) => `${m.sender === "user" ? "Customer" : "CymbalMart Assistant"}: ${m.text}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\nRecent Customer Conversation:\n${conversationContext}\n\nCustomer Message: "${message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      reply: parsed.reply || "I am your CymbalMart Assistant! How can I help you with your groceries and party supplies today?",
      suggestedActions: parsed.suggestedActions || [],
      itemsToAdd: parsed.itemsToAdd || [],
    });
  } catch (err: any) {
    console.error("CymbalMart Assistant chat error:", err);
    return res.json({
      success: true,
      reply: "Hello! I'm your CymbalMart Assistant. I'm ready to assist you with grocery lists, store aisle locations, and party calculations.",
      suggestedActions: [
        { label: "Switch to Cymbal Choice (-22%)", actionType: "OPTIMIZE_BUDGET" },
        { label: "CymbalMart Aisle Directory", actionType: "AISLE_INFO" },
        { label: "Check Drink & Ice Math", actionType: "CHECK_DRINKS" },
      ],
    });
  }
});

// 3. Smart Substitutions Engine
app.post("/api/smart-substitute", async (req, res) => {
  try {
    const { itemName, category, currentPrice, dietaryGoal } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        substitutions: [
          {
            name: `Store-brand bulk ${itemName}`,
            diff: "Same flavor profile at wholesale pricing",
            priceDelta: "-30%",
            store: "Costco / Wholesale",
          },
          {
            name: `DIY batch version of ${itemName}`,
            diff: "Made at home with 3 simple pantry staples",
            priceDelta: "-50%",
            store: "Grocery / Supermarket",
          },
          {
            name: `Plant-based / Gluten-free ${itemName}`,
            diff: "Allergen-safe alternative suitable for all guests",
            priceDelta: "+10%",
            store: "Trader Joe's / Supermarket",
          },
        ],
      });
    }

    const prompt = `As a party shopping agent, suggest 3 creative, practical substitutions for the party shopping item: "${itemName}" (Category: ${category}, Estimated Price: $${currentPrice}).
Goal/Context: ${dietaryGoal || "Budget saving or easier prep"}.

Return JSON:
{
  "substitutions": [
    {
      "name": "Alternative item name",
      "diff": "Why this is a great swap (taste, prep time, aesthetic)",
      "priceDelta": "-25% (or +5%, etc.)",
      "store": "Recommended store"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, substitutions: parsed.substitutions || [] });
  } catch (err: any) {
    return res.json({
      success: true,
      substitutions: [
        {
          name: `Wholesale bulk ${req.body.itemName || "item"}`,
          diff: "Best value per unit for party sizes",
          priceDelta: "-30%",
          store: "Costco / Wholesale",
        },
      ],
    });
  }
});

// 4. Budget Optimizer & Savings Advisor
app.post("/api/budget-optimize", async (req, res) => {
  try {
    const { plan } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        summary: "Here are 3 high-impact strategies to maximize your party budget without sacrificing quality.",
        recommendations: [
          {
            title: "Consolidate to Wholesale for Dry Goods",
            impact: "Saves ~15-20%",
            detail: "Buy paper plates, napkins, cups, chips, and sodas in bulk at Costco instead of standard supermarkets.",
          },
          {
            title: "Signature Punch Bowl vs. Open Full Bar",
            impact: "Saves ~$80-$150",
            detail: "Provide 1 batch cocktail dispenser, 1 batch mocktail, beer, and wine rather than purchasing 6 different spirits and mixers.",
          },
          {
            title: "Focal Point Decor Strategy",
            impact: "Saves ~$45",
            detail: "Concentrate 80% of your decorations around the photo area and food table rather than scattering small items across the entire venue.",
          },
        ],
      });
    }

    const itemsSummary = (plan?.shoppingList || [])
      .map((i: any) => `${i.name} ($${i.estimatedPrice}, ${i.store})`)
      .join(", ");

    const prompt = `Analyze this party plan and shopping list to find high-impact savings and store consolidation tips:
Party Title: ${plan?.title}
Target Budget: $${plan?.budget?.target}
Guest Count: ${plan?.guestCount?.total}
Items: ${itemsSummary}

Return JSON:
{
  "summary": "2-sentence executive summary of budget health and key savings opportunities",
  "recommendations": [
    {
      "title": "Actionable Tip Title",
      "impact": "e.g. Save $30-$50",
      "detail": "Detailed explanation of swap or bulk approach"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      summary: parsed.summary,
      recommendations: parsed.recommendations || [],
    });
  } catch (err: any) {
    return res.json({
      success: true,
      summary: "Optimize your shopping by prioritizing wholesale bulk staples and signature batch drinks.",
      recommendations: [
        {
          title: "Batch Drink Strategy",
          impact: "Saves $50+",
          detail: "Batching punch reduces liquor waste and keeps bar service smooth.",
        },
      ],
    });
  }
});

// 5. Hands-Free Voice Control Command Interpreter
app.post("/api/voice-command", async (req, res) => {
  try {
    const { command = "", currentPlan = {}, currentView = "shopping", openModal = "none" } = req.body;
    const cleanCmd = (command || "").trim();
    if (!cleanCmd) {
      return res.json({
        success: true,
        spokenResponse: "I didn't catch that. Please speak a command or say 'voice help'.",
        action: "GENERAL_REPLY",
        params: {},
      });
    }

    const ai = getGenAI();

    // Comprehensive offline / deterministic fallback pattern matcher
    const getFallbackAction = (text: string, plan: any) => {
      const lower = text.toLowerCase();

      // 1. Navigation & Tabs
      if (lower.includes("timeline") || lower.includes("prep schedule") || lower.includes("schedule")) {
        return {
          spokenResponse: "Switching to your party prep timeline and schedule.",
          action: "SWITCH_TAB",
          params: { tab: "timeline" },
        };
      }
      if (lower.includes("shopping list") || lower.includes("review list") || lower.includes("view list") || lower.includes("go to list")) {
        return {
          spokenResponse: "Displaying your party shopping list.",
          action: "SWITCH_TAB",
          params: { tab: "shopping" },
        };
      }

      // 2. Modals opening/closing
      if (lower.includes("close") || lower.includes("exit") || lower.includes("dismiss") || lower.includes("back to list")) {
        return {
          spokenResponse: "Closing open dialog.",
          action: "CLOSE_MODALS",
          params: {},
        };
      }
      if (lower.includes("open checkout") || lower.includes("go to checkout") || lower.includes("finish party") || lower.includes("place order") || lower.includes("curbside")) {
        return {
          spokenResponse: "Opening Refine & Checkout for delivery or curbside pickup.",
          action: "OPEN_MODAL",
          params: { modal: "checkout" },
        };
      }
      if (lower.includes("open calculator") || lower.includes("party math") || lower.includes("portion calculator") || lower.includes("drink calculator")) {
        return {
          spokenResponse: "Opening the drink and food portion calculator.",
          action: "OPEN_MODAL",
          params: { modal: "calculator" },
        };
      }
      if (lower.includes("in-store mode") || lower.includes("instore mode") || lower.includes("start shopping run") || lower.includes("store navigator")) {
        return {
          spokenResponse: "Opening mobile in-store shopping and aisle navigation mode.",
          action: "OPEN_MODAL",
          params: { modal: "instore" },
        };
      }
      if (lower.includes("open recipe") || lower.includes("signature recipe") || lower.includes("punch recipe") || lower.includes("show recipe")) {
        return {
          spokenResponse: `Opening recipe for ${plan?.signatureRecipe?.name || "Signature Party Punch"}.`,
          action: "OPEN_MODAL",
          params: { modal: "recipe" },
        };
      }
      if (lower.includes("open optimizer") || lower.includes("budget optimizer") || lower.includes("show savings tips")) {
        return {
          spokenResponse: "Opening Budget Optimizer recommendations.",
          action: "OPEN_MODAL",
          params: { modal: "optimizer" },
        };
      }
      if (lower.includes("define event") || lower.includes("new party") || lower.includes("create party") || lower.includes("plan a party") || lower.includes("plan a new")) {
        return {
          spokenResponse: "Opening the party definition wizard.",
          action: "OPEN_MODAL",
          params: { modal: "define" },
        };
      }

      // 3. Preset Selection
      if (lower.includes("preset") || lower.includes("load bbq") || lower.includes("summer bbq") || lower.includes("taco") || lower.includes("game day") || lower.includes("cocktail lounge")) {
        let presetId = "summer_backyard_bbq";
        let presetTitle = "Summer Backyard BBQ";
        if (lower.includes("taco") || lower.includes("fiesta")) {
          presetId = "taco_fiesta_night";
          presetTitle = "Taco Fiesta Night";
        } else if (lower.includes("game day") || lower.includes("tailgate")) {
          presetId = "game_day_tailgate";
          presetTitle = "Game Day Tailgate Bash";
        } else if (lower.includes("cocktail") || lower.includes("lounge")) {
          presetId = "upscale_cocktail_soiree";
          presetTitle = "Upscale Cocktail Soirée";
        } else if (lower.includes("kids") || lower.includes("birthday")) {
          presetId = "kids_carnival_birthday";
          presetTitle = "Kids Superhero & Carnival Birthday";
        }
        return {
          spokenResponse: `Loaded ${presetTitle} preset with full shopping list and budget.`,
          action: "SELECT_PRESET",
          params: { presetId },
        };
      }

      // 4. Budget Actions & Cymbal Choice Swaps
      if (lower.includes("cymbal choice") || lower.includes("switch to store brand") || lower.includes("save 22%") || lower.includes("swap all to store brand")) {
        return {
          spokenResponse: "Switched all applicable items to Cymbal Choice store brands, saving an estimated 22%.",
          action: "SWITCH_TO_CYMBAL_CHOICE",
          params: {},
        };
      }
      if (lower.includes("auto align") || lower.includes("align budget") || lower.includes("fit budget") || lower.includes("cut costs")) {
        return {
          spokenResponse: "Auto-aligned your cart to fit within your target budget by swapping to store brands and optimizing quantities.",
          action: "AUTO_ALIGN_BUDGET",
          params: {},
        };
      }

      // 5. Add Recipe ingredients
      if (lower.includes("add recipe ingredients") || lower.includes("add punch to list") || lower.includes("add ingredients")) {
        return {
          spokenResponse: "Added signature recipe ingredients to your shopping list.",
          action: "ADD_RECIPE_INGREDIENTS",
          params: {},
        };
      }

      // 6. Checking / Unchecking items
      if (lower.includes("mark all as bought") || lower.includes("mark all purchased") || lower.includes("check all")) {
        return {
          spokenResponse: "Marked all shopping list items as purchased.",
          action: "MARK_ALL_PURCHASED",
          params: { purchased: true },
        };
      }

      if (lower.startsWith("mark ") || lower.startsWith("check ") || lower.includes("bought") || lower.includes("purchased")) {
        const targetClean = lower
          .replace(/^(mark|check|toggle|i bought|purchased|got)\s+/i, "")
          .replace(/\s+(as bought|as purchased|off|done)$/i, "")
          .trim();
        return {
          spokenResponse: `Toggled purchased status for ${targetClean || "item"}.`,
          action: "TOGGLE_PURCHASED",
          params: { targetName: targetClean },
        };
      }

      // 7. Delete / Remove Item
      if (lower.startsWith("delete ") || lower.startsWith("remove ") || lower.startsWith("drop ")) {
        const targetClean = lower.replace(/^(delete|remove|drop|take off)\s+/i, "").replace(/\s+from (my |the )?list$/i, "").trim();
        return {
          spokenResponse: `Removed ${targetClean} from your shopping list.`,
          action: "DELETE_ITEM",
          params: { targetName: targetClean },
        };
      }

      // 8. Add Item
      if (lower.startsWith("add ") || lower.includes("add to list") || lower.includes("need more ")) {
        let clean = lower.replace(/^add\s+/i, "").replace(/to (my |the )?(shopping )?list$/i, "").trim();
        // Parse quantity e.g. "3 bags of ice" or "2 cases of beer"
        let quantity = 1;
        const qtyMatch = clean.match(/^(\d+)\s+(.+)$/);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
          clean = qtyMatch[2];
        }
        clean = clean.replace(/^(packs?|bags?|cases?|bottles?|boxes?|lbs?|cans?)\s+of\s+/i, "");

        let category = "food";
        let store = "CymbalMart Grocery & Pantry";
        let aisle = "Aisles 4-5 (Pantry & Snacks)";
        let estimatedPrice = Math.round(quantity * 6.5 * 100) / 100;

        if (clean.includes("beer") || clean.includes("wine") || clean.includes("soda") || clean.includes("juice") || clean.includes("drink") || clean.includes("water") || clean.includes("cocktail")) {
          category = "drinks";
          store = "CymbalMart Cellars & Beverages";
          aisle = "Aisle 8 (Beverages & Wine)";
          estimatedPrice = Math.round(quantity * 12.99 * 100) / 100;
        } else if (clean.includes("ice")) {
          category = "ice_utility";
          store = "CymbalMart Ice & Frozen";
          aisle = "Aisle 10 (Ice & Frozen)";
          estimatedPrice = Math.round(quantity * 3.5 * 100) / 100;
        } else if (clean.includes("plate") || clean.includes("cup") || clean.includes("napkin") || clean.includes("fork") || clean.includes("spoon") || clean.includes("cutlery") || clean.includes("tablecloth")) {
          category = "tableware";
          store = "CymbalMart Party & Tableware";
          aisle = "Aisle 9 (Party Supplies)";
          estimatedPrice = Math.round(quantity * 7.5 * 100) / 100;
        } else if (clean.includes("balloon") || clean.includes("garland") || clean.includes("banner") || clean.includes("light") || clean.includes("decor")) {
          category = "decor";
          store = "CymbalMart Party & Tableware";
          aisle = "Aisle 9 (Decor & Party)";
          estimatedPrice = Math.round(quantity * 14.0 * 100) / 100;
        } else if (clean.includes("cake") || clean.includes("cupcake") || clean.includes("bread") || clean.includes("bun") || clean.includes("cookie") || clean.includes("bakery")) {
          category = "food";
          store = "CymbalMart Bakery";
          aisle = "Aisle 3 (Bakery & Breads)";
          estimatedPrice = Math.round(quantity * 8.0 * 100) / 100;
        } else if (clean.includes("steak") || clean.includes("burger") || clean.includes("meat") || clean.includes("chicken") || clean.includes("pork") || clean.includes("salmon") || clean.includes("shrimp") || clean.includes("seafood") || clean.includes("hot dog")) {
          category = "food";
          store = "CymbalMart Butcher & Seafood";
          aisle = "Aisle 6 (Meat & Seafood)";
          estimatedPrice = Math.round(quantity * 18.0 * 100) / 100;
        } else if (clean.includes("deli") || clean.includes("cheese") || clean.includes("charcuterie") || clean.includes("platter") || clean.includes("prosciutto")) {
          category = "food";
          store = "CymbalMart Produce & Deli";
          aisle = "Aisle 7 (Deli & Cheese)";
          estimatedPrice = Math.round(quantity * 24.0 * 100) / 100;
        } else if (clean.includes("apple") || clean.includes("lime") || clean.includes("lemon") || clean.includes("salad") || clean.includes("veggie") || clean.includes("fruit") || clean.includes("avocado") || clean.includes("guacamole")) {
          category = "food";
          store = "CymbalMart Produce & Deli";
          aisle = "Aisles 1-2 (Fresh Produce)";
          estimatedPrice = Math.round(quantity * 5.5 * 100) / 100;
        }

        const itemName = clean.charAt(0).toUpperCase() + clean.slice(1);
        return {
          spokenResponse: `Added ${quantity} ${itemName} to ${aisle} for $${estimatedPrice.toFixed(2)}.`,
          action: "ADD_ITEM",
          params: {
            item: {
              name: itemName,
              category,
              store,
              brand: "Cymbal Choice",
              aisle,
              quantity,
              unit: quantity > 1 ? "packs" : "pack",
              estimatedPrice,
              priority: "must_have",
              notes: "Added via Hands-Free Voice Control",
            },
          },
        };
      }

      // 9. Store Aisle Inquiries
      if (lower.includes("where is") || lower.includes("where are") || lower.includes("which aisle") || lower.includes("find ")) {
        let query = lower.replace(/^(where is|where are|which aisle is|which aisle are|how to find|find)\s+(the\s+)?/i, "").trim();
        let aisleAnswer = "Aisles 4-5 (Pantry & Dry Goods)";
        if (query.includes("fruit") || query.includes("veg") || query.includes("salad") || query.includes("avocado") || query.includes("produce")) {
          aisleAnswer = "Aisles 1-2: Fresh Produce & Organic Greens";
        } else if (query.includes("cake") || query.includes("bread") || query.includes("bun") || query.includes("pastry") || query.includes("bakery")) {
          aisleAnswer = "Aisle 3: CymbalMart Bakery & Custom Celebration Cakes";
        } else if (query.includes("meat") || query.includes("steak") || query.includes("chicken") || query.includes("burger") || query.includes("fish") || query.includes("seafood")) {
          aisleAnswer = "Aisle 6: Fresh Butcher Shop & Sustainable Seafood";
        } else if (query.includes("deli") || query.includes("cheese") || query.includes("charcuterie") || query.includes("platter") || query.includes("sandwich")) {
          aisleAnswer = "Aisle 7: CymbalMart Deli Platters & Artisan Cheeses";
        } else if (query.includes("beer") || query.includes("wine") || query.includes("seltzer") || query.includes("soda") || query.includes("drink") || query.includes("beverage")) {
          aisleAnswer = "Aisle 8: Chilled Beverages, Craft Beers, Seltzers & Table Wines";
        } else if (query.includes("plate") || query.includes("cup") || query.includes("napkin") || query.includes("decor") || query.includes("party") || query.includes("balloon")) {
          aisleAnswer = "Aisle 9: Party Supplies, Tableware, Eco-Plates & Festive Decor";
        } else if (query.includes("ice") || query.includes("frozen") || query.includes("ice cream") || query.includes("appetizer")) {
          aisleAnswer = "Aisle 10 & Front Registers: Ice Freezers & Frozen Party Appetizers";
        }
        return {
          spokenResponse: `You can find that in ${aisleAnswer}.`,
          action: "NAVIGATE_AISLE",
          params: { aisleInfo: aisleAnswer },
        };
      }

      // 10. Filter by category or store
      if (lower.includes("filter by") || lower.includes("show drinks") || lower.includes("show food") || lower.includes("show decor") || lower.includes("show bakery") || lower.includes("show produce") || lower.includes("show all")) {
        let store = "all";
        let category = "all";
        if (lower.includes("drink") || lower.includes("beverage")) store = "CymbalMart Cellars & Beverages";
        else if (lower.includes("bakery")) store = "CymbalMart Bakery";
        else if (lower.includes("deli") || lower.includes("produce")) store = "CymbalMart Produce & Deli";
        else if (lower.includes("meat") || lower.includes("butcher")) store = "CymbalMart Butcher & Seafood";
        else if (lower.includes("tableware") || lower.includes("decor") || lower.includes("party")) store = "CymbalMart Party & Tableware";
        else if (lower.includes("ice") || lower.includes("frozen")) store = "CymbalMart Ice & Frozen";

        return {
          spokenResponse: `Filtered your view to ${store === "all" ? "all store aisles" : store}.`,
          action: "FILTER_STORE",
          params: { store },
        };
      }

      // 11. Read list / Summary
      if (lower.includes("read list") || lower.includes("what is on my list") || lower.includes("what's on my list") || lower.includes("how many items") || lower.includes("budget summary")) {
        const total = plan?.shoppingList?.length || 0;
        const bought = (plan?.shoppingList || []).filter((i: any) => i.purchased).length;
        const remaining = total - bought;
        const cost = (plan?.shoppingList || []).reduce((s: number, i: any) => s + (i.estimatedPrice || 0), 0);
        return {
          spokenResponse: `You have ${total} items total ($${cost.toFixed(0)} of $${plan?.budget?.target || 350} budget). ${bought} purchased and ${remaining} remaining.`,
          action: "READ_SUMMARY",
          params: { total, bought, remaining, cost },
        };
      }

      // 12. Drink Calculations
      if (lower.includes("calculate drinks") || lower.includes("how much alcohol") || lower.includes("how much ice") || lower.includes("drink math")) {
        const adults = plan?.guestCount?.adults || 16;
        const dur = plan?.durationHours || 4;
        const totalServings = adults * (2 + Math.max(0, dur - 1));
        const wine = Math.ceil((totalServings * 0.35) / 5);
        const beer = Math.ceil(totalServings * 0.4);
        const ice = Math.ceil(adults * 1.5);
        return {
          spokenResponse: `For ${adults} drinking guests over ${dur} hours: You will need ${wine} bottles of wine, ${beer} beers or seltzers, and ${ice} pounds of ice.`,
          action: "CALCULATE_DRINKS",
          params: { wine, beer, ice, totalServings },
        };
      }

      // Default conversational fallback
      return {
        spokenResponse: `I heard "${text}". You can ask me to add items, mark items as bought, swap to Cymbal Choice, find aisle numbers, open checkout, or calculate drinks hands-free.`,
        action: "GENERAL_REPLY",
        params: {},
      };
    };

    if (!ai) {
      const fallbackResult = getFallbackAction(cleanCmd, currentPlan);
      return res.json({ success: true, ...fallbackResult, source: "offline_nlp" });
    }

    const systemPrompt = `You are the Hands-Free Voice Control Engine for CymbalMart's Party Planner Shopping Agent.
The customer is speaking voice commands while cooking, shopping in store, or multi-tasking.
You must interpret their spoken command and generate a structured JSON action and a concise, natural, friendly spoken reply for text-to-speech (TTS).

Current Party Context:
- Plan Title: "${currentPlan?.title || "Party Plan"}"
- Total Budget: $${currentPlan?.budget?.target || 350}
- Headcount: ${currentPlan?.guestCount?.adults || 12} adults, ${currentPlan?.guestCount?.kids || 0} kids (Duration: ${currentPlan?.durationHours || 4} hrs)
- Active Screen: ${currentView}
- Open Modal: ${openModal}
- Current Shopping List (${currentPlan?.shoppingList?.length || 0} items):
${(currentPlan?.shoppingList || []).slice(0, 12).map((i: any) => `  • [${i.id}] ${i.name} (qty: ${i.quantity}, $${i.estimatedPrice}, ${i.store}, bought: ${i.purchased})`).join("\n")}

Supported Action Types:
1. "ADD_ITEM" - params: { item: { name, category, store, brand, aisle, quantity, unit, estimatedPrice, priority, notes } }
   Stores: "CymbalMart Produce & Deli" | "CymbalMart Bakery" | "CymbalMart Butcher & Seafood" | "CymbalMart Grocery & Pantry" | "CymbalMart Cellars & Beverages" | "CymbalMart Party & Tableware" | "CymbalMart Ice & Frozen" | "Cymbal Club Wholesale Bulk"
2. "DELETE_ITEM" - params: { targetName: string }
3. "TOGGLE_PURCHASED" - params: { targetName: string }
4. "MARK_ALL_PURCHASED" - params: { purchased: boolean }
5. "SWITCH_TAB" - params: { tab: "shopping" | "timeline" | "budget" }
6. "OPEN_MODAL" - params: { modal: "define" | "calculator" | "optimizer" | "instore" | "recipe" | "checkout" | "chat" }
7. "CLOSE_MODALS" - params: {}
8. "SWITCH_TO_CYMBAL_CHOICE" - params: {} (Switches items to store brand -22%)
9. "AUTO_ALIGN_BUDGET" - params: {}
10. "SELECT_PRESET" - params: { presetId: "summer_backyard_bbq" | "taco_fiesta_night" | "game_day_tailgate" | "upscale_cocktail_soiree" | "kids_carnival_birthday" }
11. "FILTER_STORE" - params: { store: string | "all" }
12. "NAVIGATE_AISLE" - params: { aisleInfo: string }
13. "ADD_RECIPE_INGREDIENTS" - params: {}
14. "CALCULATE_DRINKS" - params: { adults?: number, hours?: number }
15. "READ_SUMMARY" - params: {}
16. "GENERAL_REPLY" - params: {}

Response Guidelines:
- "spokenResponse": 1-2 conversational sentences, easy to understand when read aloud by TTS.
- Always provide valid JSON matching:
{
  "spokenResponse": "Short audio reply for customer",
  "action": "ACTION_NAME",
  "params": {}
}`;

    const prompt = `${systemPrompt}\n\nSpoken Customer Voice Input: "${cleanCmd}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text || "{}");
    } catch (e) {
      console.warn("Gemini voice parse fallback:", e);
      parsed = getFallbackAction(cleanCmd, currentPlan);
    }

    if (!parsed.action || !parsed.spokenResponse) {
      const fallback = getFallbackAction(cleanCmd, currentPlan);
      parsed = { ...fallback, ...parsed };
    }

    return res.json({
      success: true,
      spokenResponse: parsed.spokenResponse,
      action: parsed.action,
      params: parsed.params || {},
      source: "gemini_voice_ai",
    });
  } catch (err: any) {
    console.error("Voice command processing error:", err);
    const fallback = {
      spokenResponse: "Executed command.",
      action: "GENERAL_REPLY",
      params: {},
    };
    return res.json({ success: true, ...fallback, error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Party Planner Shopping Agent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
